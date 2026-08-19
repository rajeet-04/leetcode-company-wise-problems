"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { InterviewPlan } from "@leet-progress/plans";
import { applyBackup, createBackup, LEGACY_SOLVED_STORAGE_KEY, migrateLegacySolved, parseBackup, scheduleNextRevision, solvedSlugs, type LeetProgressBackup, type ProblemProgress } from "@leet-progress/progress";
import { SYNC_PROTOCOL_VERSION, SYNC_SCHEMA_VERSION, applyProgressMutations, bootstrapProgressMutations, createTargetsMutation, deriveInterviewPlans, deriveTargetCompanies, mergeMutations, type ProgressMutation } from "@leet-progress/sync";
import { chooseProgressStore, type BrowserProgressStore } from "@/src/local/progress-store";

type ProgressContextValue = {
  progress: ProblemProgress[];
  mutations: ProgressMutation[];
  solved: Set<string>;
  targetCompanies: string[];
  plans: InterviewPlan[];
  ready: boolean;
  installationId: string | null;
  toggleSolved(slug: string): void;
  importSolved(slugs: readonly string[]): void;
  toggleTargetCompany(company: string): void;
  setTargetCompanies(companies: readonly string[]): void;
  completeRevision(slug: string, priorityScore: number): void;
  savePlan(plan: InterviewPlan): void;
  deletePlan(planId: string): void;
  createLocalBackup(): LeetProgressBackup;
  mergeLocalBackup(value: unknown): void;
  applyRemoteMutations(mutations: readonly ProgressMutation[]): void;
};

const ProgressContext = createContext<ProgressContextValue | null>(null);

function readLegacySolved(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(LEGACY_SOLVED_STORAGE_KEY) ?? "[]") as unknown;
    return Array.isArray(parsed) ? parsed.map(String).filter(Boolean) : [];
  } catch {
    return [];
  }
}

function initialProgress(): ProblemProgress[] {
  return migrateLegacySolved([], readLegacySolved(), new Date(0).toISOString());
}

function mutationId(installationId: string, at: string) {
  return `web:${installationId}:${at}:${crypto.randomUUID()}`;
}

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<ProblemProgress[]>(initialProgress);
  const [mutations, setMutations] = useState<ProgressMutation[]>([]);
  const [targetCompanies, setTargetsState] = useState<string[]>([]);
  const [plans, setPlans] = useState<InterviewPlan[]>([]);
  const [installationId, setInstallationId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const storeRef = useRef<BrowserProgressStore | null>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      const store = await chooseProgressStore();
      const id = await store.getInstallationId();
      const existing = await store.listProblems();
      const preferences = await store.getPreferences();
      const migrated = migrateLegacySolved(existing, readLegacySolved(), new Date().toISOString());
      const stored = await store.listMutations();
      const bootstrap: ProgressMutation[] = [];
      if (!stored.some((mutation) => mutation.type === "PROBLEM_STATE_SET")) bootstrap.push(...bootstrapProgressMutations(migrated, id, "web"));
      if (!stored.some((mutation) => mutation.type === "TARGETS_SET") && preferences.targetCompanies.length) {
        const at = new Date(0).toISOString();
        bootstrap.push(createTargetsMutation(preferences.targetCompanies, id, "web", at, `web:bootstrap:targets:${id}`));
      }
      const merged = mergeMutations(stored, bootstrap);
      for (const mutation of bootstrap) await store.putMutation(mutation);
      const derived = merged.length ? applyProgressMutations([], merged) : migrated;
      const targets = deriveTargetCompanies(merged, preferences.targetCompanies);
      const derivedPlans = deriveInterviewPlans(merged);
      for (const item of derived) await store.putProblem(item);
      await store.putPreferences({ ...preferences, targetCompanies: targets });
      if (!active) return;
      storeRef.current = store;
      setInstallationId(id);
      setMutations(merged);
      setProgress(derived);
      setTargetsState(targets);
      setPlans(derivedPlans);
      setReady(true);
    })().catch((error) => console.error("Leet Progress local store initialization failed", error));
    return () => { active = false; };
  }, []);

  const commitMutations = useCallback((incoming: readonly ProgressMutation[]) => {
    if (!incoming.length) return;
    setMutations((current) => {
      const merged = mergeMutations(current, incoming);
      if (merged.length === current.length) return current;
      const derived = applyProgressMutations([], merged);
      const targets = deriveTargetCompanies(merged);
      const derivedPlans = deriveInterviewPlans(merged);
      setProgress(derived);
      setTargetsState(targets);
      setPlans(derivedPlans);
      const store = storeRef.current;
      if (store) {
        void Promise.all([
          ...incoming.map((mutation) => store.putMutation(mutation)),
          ...derived.map((item) => store.putProblem(item)),
          store.getPreferences().then((preferences) => store.putPreferences({ ...preferences, targetCompanies: targets })),
        ]).catch((error) => console.error("Leet Progress local mutation persistence failed", error));
      }
      return merged;
    });
  }, []);

  const toggleSolved = useCallback((slug: string) => {
    if (!ready || !installationId) return;
    const existing = progress.find((item) => item.slug === slug);
    const currentlySolved = existing ? ["solved", "revision_due", "mastered"].includes(existing.status) : false;
    const at = new Date().toISOString();
    const mutation: ProgressMutation = currentlySolved
      ? { protocolVersion: 1, schemaVersion: 1, mutationId: mutationId(installationId, at), installationId, source: "web", type: "PROBLEM_STATUS_SET", occurredAt: at, payload: { slug, status: existing?.attempts ? "attempted" : "unseen" } }
      : { protocolVersion: 1, schemaVersion: 1, mutationId: mutationId(installationId, at), installationId, source: "web", type: "PROBLEM_SOLVED", occurredAt: at, payload: { slug } };
    commitMutations([mutation]);
  }, [commitMutations, installationId, progress, ready]);

  const importSolved = useCallback((slugs: readonly string[]) => {
    if (!ready || !installationId) return;
    const solvedNow = solvedSlugs(progress);
    const at = new Date().toISOString();
    commitMutations([...new Set(slugs)].filter((slug) => !solvedNow.has(slug)).map((slug, index): ProgressMutation => ({
      protocolVersion: SYNC_PROTOCOL_VERSION,
      schemaVersion: SYNC_SCHEMA_VERSION,
      mutationId: mutationId(installationId, `${at}:${index}`),
      installationId,
      source: "web",
      type: "PROBLEM_SOLVED",
      occurredAt: at,
      payload: { slug },
    })));
  }, [commitMutations, installationId, progress, ready]);

  const setTargetCompanies = useCallback((companies: readonly string[]) => {
    if (!ready || !installationId) return;
    const at = new Date().toISOString();
    commitMutations([createTargetsMutation(companies, installationId, "web", at, mutationId(installationId, at))]);
  }, [commitMutations, installationId, ready]);

  const toggleTargetCompany = useCallback((company: string) => {
    const next = new Set(targetCompanies);
    if (next.has(company)) next.delete(company); else next.add(company);
    setTargetCompanies([...next]);
  }, [setTargetCompanies, targetCompanies]);

  const completeRevision = useCallback((slug: string, priorityScore: number) => {
    if (!ready || !installationId) return;
    const current = progress.find((item) => item.slug === slug);
    if (!current) return;
    const at = new Date().toISOString();
    const schedule = scheduleNextRevision(current, at, priorityScore);
    commitMutations([{ protocolVersion: 1, schemaVersion: 1, mutationId: mutationId(installationId, at), installationId, source: "web", type: "REVISION_COMPLETED", occurredAt: at, payload: { slug, nextDueAt: schedule.dueAt } }]);
  }, [commitMutations, installationId, progress, ready]);

  const savePlan = useCallback((plan: InterviewPlan) => {
    if (!ready || !installationId) return;
    const at = new Date().toISOString();
    const normalized: InterviewPlan = {
      ...plan,
      createdAt: plan.createdAt || at,
      updatedAt: at,
      targetCompanies: [...new Set(plan.targetCompanies)].sort((a, b) => a.localeCompare(b)),
      excludedTopics: [...new Set(plan.excludedTopics)].sort((a, b) => a.localeCompare(b)),
      pinnedSlugs: [...new Set(plan.pinnedSlugs)],
      deferredSlugs: [...new Set(plan.deferredSlugs)],
    };
    commitMutations([{ protocolVersion: 1, schemaVersion: 1, mutationId: mutationId(installationId, at), installationId, source: "web", type: "PLAN_UPSERT", occurredAt: at, payload: { plan: normalized } }]);
  }, [commitMutations, installationId, ready]);

  const deletePlan = useCallback((planId: string) => {
    if (!ready || !installationId) return;
    const at = new Date().toISOString();
    commitMutations([{ protocolVersion: 1, schemaVersion: 1, mutationId: mutationId(installationId, at), installationId, source: "web", type: "PLAN_DELETE", occurredAt: at, payload: { planId } }]);
  }, [commitMutations, installationId, ready]);

  const createLocalBackup = useCallback(() => createBackup(progress, { targetCompanies }, new Date().toISOString()), [progress, targetCompanies]);

  const mergeLocalBackup = useCallback((value: unknown) => {
    if (!ready || !installationId) throw new Error("Local progress store is not ready");
    const backup = parseBackup(value);
    const mergedState = applyBackup(progress, { targetCompanies }, backup, "merge");
    const currentBySlug = new Map(progress.map((item) => [item.slug, item]));
    const changed = mergedState.progress.filter((item) => JSON.stringify(currentBySlug.get(item.slug) ?? null) !== JSON.stringify(item));
    const at = new Date().toISOString();
    const incoming: ProgressMutation[] = changed.map((item, index) => ({
      protocolVersion: SYNC_PROTOCOL_VERSION,
      schemaVersion: SYNC_SCHEMA_VERSION,
      mutationId: mutationId(installationId, `${at}:backup:${index}`),
      installationId,
      source: "web",
      type: "PROBLEM_STATE_SET",
      occurredAt: at,
      payload: { progress: item },
    }));
    const currentTargets = [...targetCompanies].sort((a, b) => a.localeCompare(b));
    const backupTargets = [...mergedState.preferences.targetCompanies].sort((a, b) => a.localeCompare(b));
    if (JSON.stringify(currentTargets) !== JSON.stringify(backupTargets)) {
      incoming.push(createTargetsMutation(backupTargets, installationId, "web", at, mutationId(installationId, `${at}:backup:targets`)));
    }
    commitMutations(incoming);
  }, [commitMutations, installationId, progress, ready, targetCompanies]);

  const applyRemoteMutations = useCallback((incoming: readonly ProgressMutation[]) => commitMutations(incoming), [commitMutations]);
  const solved = useMemo(() => solvedSlugs(progress), [progress]);
  const value = useMemo(() => ({ progress, mutations, solved, targetCompanies, plans, ready, installationId, toggleSolved, importSolved, toggleTargetCompany, setTargetCompanies, completeRevision, savePlan, deletePlan, createLocalBackup, mergeLocalBackup, applyRemoteMutations }), [progress, mutations, solved, targetCompanies, plans, ready, installationId, toggleSolved, importSolved, toggleTargetCompany, setTargetCompanies, completeRevision, savePlan, deletePlan, createLocalBackup, mergeLocalBackup, applyRemoteMutations]);

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): ProgressContextValue {
  const value = useContext(ProgressContext);
  if (!value) throw new Error("useProgress must be used inside ProgressProvider");
  return value;
}
