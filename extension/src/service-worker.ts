import { buildProblemIntelligence } from "@leet-progress/intelligence";
import { SYNC_PROTOCOL_VERSION, validateMutation } from "@leet-progress/sync";
import type { CatalogProblem } from "@leet-progress/types";
import { createCatalogIndex, lookupCatalogProblem } from "./catalog-index";
import { isAllowedLeetCodeUrl } from "./leetcode-origin";
import { isExtensionRequest, type ExtensionResponse } from "./messages";
import { getCurrentProblemSlug, setCurrentProblemSlug } from "./storage";
import { createSubmissionMutation } from "./submission-mutation";
import { appendExtensionMutation, exchangeExtensionMutations, getExtensionInstallationId, getExtensionSyncState } from "./sync-storage";
import { isAllowedWebsiteUrl } from "./website-bridge-policy";

let catalogPromise: Promise<ReadonlyMap<string, CatalogProblem>> | null = null;
async function catalogIndex() {
  catalogPromise ??= fetch(chrome.runtime.getURL("catalog.json")).then((response) => {
    if (!response.ok) throw new Error(`Catalog load failed: ${response.status}`);
    return response.json() as Promise<CatalogProblem[]>;
  }).then(createCatalogIndex);
  return catalogPromise;
}

async function problemPayload(slug: string) {
  const problem = lookupCatalogProblem(await catalogIndex(), slug);
  if (!problem) return null;
  const local = await getExtensionSyncState();
  const progress = local.progress.find((item) => item.slug === slug) ?? null;
  const intelligence = buildProblemIntelligence(problem, { targetCompanies: local.targetCompanies, progress });
  return { problem, intelligence, priority: intelligence.priority };
}

chrome.runtime.onInstalled.addListener(() => { void chrome.storage.local.setAccessLevel({ accessLevel: "TRUSTED_CONTEXTS" }); });

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
    const tabId = sender.tab?.id;
    if (!tabId) return { ok: false, error: "No active LeetCode tab" };
    await chrome.sidePanel.open({ tabId });
    return { ok: true };
  })().then(sendResponse, (error) => sendResponse({ ok: false, error: error instanceof Error ? error.message : "Extension error" } satisfies ExtensionResponse));
  return true;
});
