"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { LEGACY_SOLVED_STORAGE_KEY, migrateLegacySolved, solvedSlugs, type ProblemProgress } from "@leet-progress/progress";
import {
  SYNC_PROTOCOL_VERSION,
  SYNC_SCHEMA_VERSION,
  applyProgressMutations,
  bootstrapProgressMutations,
  mergeMutations,
  type ProgressMutation,
} from "@leet-progress/sync";
import { chooseProgressStore, type BrowserProgressStore } from "@/src/local/progress-store";

type ProgressContextValue = {
  progress: ProblemProgress[];
  mutations: ProgressMutation[];
  solved: Set<string>;
  ready: boolean;
  installationId: string | null;
  toggleSolved(slug: string): void;
  importSolved(slugs: readonly string[]): void;
  applyRemoteMutations(mutations: readonly ProgressMutation[]): void;
};

const ProgressContext = createContext<ProgressContextValue | null>(null);

function readLegacySolved(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(LEGACY_SOLVED_STORAGE_KEY) ?? "[]") as unknown;
    return Array.isArray(parsed) ? parsed.map(String).filter(Boolean) : [];
  } catch { return []; }
}

function initialProgress(): ProblemProgress[] {
  return migrateLegacySolved([], readLegacySolved(), new Date(0).toISOString());
}

function mutationId(source: "web", installationId: string, at: string) {
  return `${source}:${installationId}:${at}:${crypto.randomUUID()}`;
}

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<ProblemProgress[]>(initialProgress);
  const [mutations, setMutations] = useState<ProgressMutation[]>([]);
  const [installationId, setInstallationId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const storeRef = useRef<BrowserProgressStore | null>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      const store = await chooseProgressStore();
      const id = await store.getInstallationId();
      const existing = await store.listProblems();
      const migrated = migrateLegacySolved(existing, readLegacySolved(), new Date().toISOString());
      const storedMutations = await store.listMutations();
      const bootstrap = storedMutations.length === 0 ? bootstrapProgressMutations(migrated, id, "web") : [];
      const merged = mergeMutations(storedMutations, bootstrap);
      for (const mutation of bootstrap) await store.putMutation(mutation);
      const derived = merged.length ? applyProgressMutations([], merged) : migrated;
      for (const item of derived) await store.putProblem(item);
      if (!active) return;
      storeRef.current = store;
      setInstallationId(id);
      setMutations(merged);
      setProgress(derived);
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
      setProgress(derived);
      const store = storeRef.current;
      if (store) {
        void Promise.all([
          ...incoming.map((mutation) => store.putMutation(mutation)),
          ...derived.map((item) => store.putProblem(item)),
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
      ? {
          protocolVersion: SYNC_PROTOCOL_VERSION,
          schemaVersion: SYNC_SCHEMA_VERSION,
          mutationId: mutationId("web", installationId, at),
          installationId,
          source: "web",
          type: "PROBLEM_STATUS_SET",
          occurredAt: at,
          payload: { slug, status: existing?.attempts ? "attempted" : "unseen" },
        }
      : {
          protocolVersion: SYNC_PROTOCOL_VERSION,
          schemaVersion: SYNC_SCHEMA_VERSION,
          mutationId: mutationId("web", installationId, at),
          installationId,
          source: "web",
          type: "PROBLEM_SOLVED",
          occurredAt: at,
          payload: { slug },
        };
    commitMutations([mutation]);
  }, [commitMutations, installationId, progress, ready]);

  const importSolved = useCallback((slugs: readonly string[]) => {
    if (!ready || !installationId) return;
    const solvedNow = solvedSlugs(progress);
    const at = new Date().toISOString();
    const incoming = [...new Set(slugs)].filter((slug) => !solvedNow.has(slug)).map((slug, index): ProgressMutation => ({
      protocolVersion: SYNC_PROTOCOL_VERSION,
      schemaVersion: SYNC_SCHEMA_VERSION,
      mutationId: mutationId("web", installationId, `${at}:${index}`),
      installationId,
      source: "web",
      type: "PROBLEM_SOLVED",
      occurredAt: at,
      payload: { slug },
    }));
    commitMutations(incoming);
  }, [commitMutations, installationId, progress, ready]);

  const applyRemoteMutations = useCallback((incoming: readonly ProgressMutation[]) => commitMutations(incoming), [commitMutations]);
  const solved = useMemo(() => solvedSlugs(progress), [progress]);
  const value = useMemo(() => ({ progress, mutations, solved, ready, installationId, toggleSolved, importSolved, applyRemoteMutations }), [progress, mutations, solved, ready, installationId, toggleSolved, importSolved, applyRemoteMutations]);

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): ProgressContextValue {
  const value = useContext(ProgressContext);
  if (!value) throw new Error("useProgress must be used inside ProgressProvider");
  return value;
}
