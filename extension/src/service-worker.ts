import { calculateCompanyReadiness } from "@leet-progress/analytics";
import { buildProblemIntelligence } from "@leet-progress/intelligence";
import { buildAdaptivePlan } from "@leet-progress/plans";
import { recommendProblems } from "@leet-progress/recommendations";
import { SYNC_PROTOCOL_VERSION, deriveInterviewPlans, validateMutation } from "@leet-progress/sync";
import type { CatalogProblem } from "@leet-progress/types";
import { openExtensionPanel, restrictExtensionStorageAccess } from "./browser-runtime";
import { loadCachedCatalog } from "./catalog-cache";
import { CATALOG_REFRESH_ALARM, refreshPublicCatalog } from "./catalog-refresh";
import { createCatalogIndex, lookupCatalogProblem } from "./catalog-index";
import { isAllowedLeetCodeUrl } from "./leetcode-origin";
import { isExtensionRequest, type ExtensionResponse } from "./messages";
import { getCurrentProblemSlug, setCurrentProblemSlug } from "./storage";
import { createSubmissionMutation } from "./submission-mutation";
import { appendExtensionMutation, exchangeExtensionMutations, getExtensionInstallationId, getExtensionSyncState } from "./sync-storage";
import { isAllowedWebsiteUrl } from "./website-bridge-policy";

let catalogPromise: Promise<ReadonlyMap<string, CatalogProblem>> | null = null;

async function packagedCatalog(): Promise<CatalogProblem[]> {
  const response = await fetch(chrome.runtime.getURL("catalog.json"));
  if (!response.ok) throw new Error(`Packaged catalog load failed: ${response.status}`);
  return response.json() as Promise<CatalogProblem[]>;
}

async function catalogIndex() {
  catalogPromise ??= (async () => {
    try {
      const cached = await loadCachedCatalog();
      if (cached?.problems.length) return createCatalogIndex(cached.problems);
    } catch (error) {
      console.warn("Leet Progress cached catalog unavailable", error);
    }
    return createCatalogIndex(await packagedCatalog());
  })();
  return catalogPromise;
}

async function refreshCatalogSafely() {
  try {
    const problems = await refreshPublicCatalog();
    if (problems?.length) catalogPromise = Promise.resolve(createCatalogIndex(problems));
  } catch (error) {
    console.warn("Leet Progress public catalog refresh failed; keeping last known good snapshot", error);
  }
}

async function ensureCatalogAlarm() {
  const existing = await chrome.alarms.get(CATALOG_REFRESH_ALARM);
  if (!existing) await chrome.alarms.create(CATALOG_REFRESH_ALARM, { delayInMinutes: 5, periodInMinutes: 360 });
}

function planSlugs(adaptive: ReturnType<typeof buildAdaptivePlan>): string[] {
  return [...new Set([...adaptive.dailyQueue, ...adaptive.buckets.mustSolve, ...adaptive.buckets.highPriority, ...adaptive.buckets.revision, ...adaptive.buckets.weakArea])];
}

async function problemPayload(slug: string) {
  const index = await catalogIndex();
  const catalog = [...index.values()];
  const problem = lookupCatalogProblem(index, slug);
  if (!problem) return null;
  const local = await getExtensionSyncState();
  const progress = local.progress.find((item) => item.slug === slug) ?? null;
  const plans = deriveInterviewPlans(local.mutations);
  const definition = plans[0] ?? null;
  const now = new Date().toISOString();
  const adaptive = definition ? buildAdaptivePlan(catalog, local.progress, definition, now) : null;
  const relevantSlugs = adaptive ? planSlugs(adaptive) : [];
  const intelligence = buildProblemIntelligence(problem, { targetCompanies: local.targetCompanies, progress, planRelevant: relevantSlugs.includes(slug), weakTopicMatches: adaptive?.weakTopics.filter((topic) => problem.topics.includes(topic)).length ?? 0 });
  const recommendations = recommendProblems(catalog, { targetCompanies: local.targetCompanies, progress: local.progress, currentProblem: problem, weakTopics: adaptive?.weakTopics ?? [], planSlugs: relevantSlugs, limit: 5 });
  const targetReadiness = local.targetCompanies.slice(0, 5).map((company) => calculateCompanyReadiness(catalog, local.progress, company, now));
  return { problem, intelligence, priority: intelligence.priority, recommendations, plan: definition && adaptive ? { definition, adaptive } : null, targetReadiness };
}

void ensureCatalogAlarm().catch((error) => console.warn("Leet Progress catalog alarm setup failed", error));
void restrictExtensionStorageAccess().catch((error) => console.warn("Leet Progress storage access hardening unavailable", error));
chrome.alarms.onAlarm.addListener((alarm) => { if (alarm.name === CATALOG_REFRESH_ALARM) void refreshCatalogSafely(); });
chrome.runtime.onInstalled.addListener(() => {
  void restrictExtensionStorageAccess().catch((error) => console.warn("Leet Progress storage access hardening unavailable", error));
  void refreshCatalogSafely();
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!isExtensionRequest(message)) { sendResponse({ ok: false, error: "Unsupported message" } satisfies ExtensionResponse); return; }
  void (async (): Promise<ExtensionResponse> => {
    if (message.type === "sync:exchange") {
      if (!isAllowedWebsiteUrl(sender.url)) return { ok: false, error: "Sync origin rejected" };
      if (message.protocolVersion !== SYNC_PROTOCOL_VERSION) return { ok: false, error: "Sync protocol mismatch" };
      if (!Array.isArray(message.mutations) || !message.mutations.every(validateMutation)) return { ok: false, error: "Invalid sync mutation batch" };
      const state = await exchangeExtensionMutations(message.mutations, message.knownMutationIds);
      return { ok: true, installationId: await getExtensionInstallationId(), mutations: state.outgoing };
    }
    if (message.type === "progress:submission") {
      if (!isAllowedLeetCodeUrl(sender.url)) return { ok: false, error: "Submission origin rejected" };
      if (!message.outcome || (message.outcome.kind !== "accepted" && message.outcome.kind !== "failed")) return { ok: false, error: "Invalid submission outcome" };
      const installationId = await getExtensionInstallationId();
      const mutation = createSubmissionMutation({ slug: message.slug, outcome: message.outcome, fingerprint: message.fingerprint, installationId, at: message.observedAt });
      await appendExtensionMutation(mutation);
      return { ok: true };
    }
    if (message.type === "state:set-current") { await setCurrentProblemSlug(message.slug); return { ok: true, slug: message.slug }; }
    if (message.type === "problem:lookup") { const data = await problemPayload(message.slug); return data ? { ok: true, data } : { ok: false, error: "Problem not found in catalog" }; }
    if (message.type === "state:get-current") { const slug = await getCurrentProblemSlug(); if (!slug) return { ok: true, slug: null }; const data = await problemPayload(slug); return { ok: true, slug, ...(data ? { data } : {}) }; }
    await openExtensionPanel(sender.tab?.id);
    return { ok: true };
  })().then(sendResponse, (error) => sendResponse({ ok: false, error: error instanceof Error ? error.message : "Extension error" } satisfies ExtensionResponse));
  return true;
});
