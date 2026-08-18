import { scoreProblemPriority } from "@leet-progress/intelligence";
import type { CatalogProblem } from "@leet-progress/types";
import { createCatalogIndex, lookupCatalogProblem } from "./catalog-index";
import { isExtensionRequest, type ExtensionResponse } from "./messages";
import { getCurrentProblemSlug, getTargetCompanies, setCurrentProblemSlug } from "./storage";

let catalogPromise: Promise<ReadonlyMap<string, CatalogProblem>> | null = null;

async function catalogIndex() {
  catalogPromise ??= fetch(chrome.runtime.getURL("catalog.json"))
    .then((response) => {
      if (!response.ok) throw new Error(`Catalog load failed: ${response.status}`);
      return response.json() as Promise<CatalogProblem[]>;
    })
    .then(createCatalogIndex);
  return catalogPromise;
}

async function problemPayload(slug: string) {
  const problem = lookupCatalogProblem(await catalogIndex(), slug);
  if (!problem) return null;
  const targetCompanies = await getTargetCompanies();
  return { problem, priority: scoreProblemPriority(problem, { targetCompanies }) };
}

chrome.runtime.onInstalled.addListener(() => {
  void chrome.storage.local.setAccessLevel({ accessLevel: "TRUSTED_CONTEXTS" });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!isExtensionRequest(message)) {
    sendResponse({ ok: false, error: "Unsupported message" } satisfies ExtensionResponse);
    return;
  }

  void (async (): Promise<ExtensionResponse> => {
    if (message.type === "state:set-current") {
      await setCurrentProblemSlug(message.slug);
      return { ok: true, slug: message.slug };
    }
    if (message.type === "problem:lookup") {
      const data = await problemPayload(message.slug);
      return data ? { ok: true, data } : { ok: false, error: "Problem not found in catalog" };
    }
    if (message.type === "state:get-current") {
      const slug = await getCurrentProblemSlug();
      if (!slug) return { ok: true, slug: null };
      const data = await problemPayload(slug);
      return { ok: true, slug, ...(data ? { data } : {}) };
    }
    const tabId = sender.tab?.id;
    if (!tabId) return { ok: false, error: "No active LeetCode tab" };
    await chrome.sidePanel.open({ tabId });
    return { ok: true };
  })().then(sendResponse, (error) => sendResponse({ ok: false, error: error instanceof Error ? error.message : "Extension error" } satisfies ExtensionResponse));

  return true;
});
