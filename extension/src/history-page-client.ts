import { HISTORY_REQUEST_TYPE, parseHistoryImportResult } from "./history-import";
import type { ExtensionResponse } from "./messages";

export type HistoryReconcileResult = { imported: number; solvedCount: number };

let activeReconcile: Promise<HistoryReconcileResult> | null = null;

function requestSolvedHistoryFromPage(): Promise<string[]> {
  const requestId = crypto.randomUUID();
  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      window.removeEventListener("message", onMessage);
      reject(new Error("history-reconcile-timeout"));
    }, 30_000);

    function onMessage(event: MessageEvent) {
      if (event.source !== window || event.origin !== window.location.origin) return;
      const data = event.data as { requestId?: unknown };
      if (data?.requestId !== requestId) return;
      window.clearTimeout(timeout);
      window.removeEventListener("message", onMessage);
      const parsed = parseHistoryImportResult(event.data);
      if (!parsed.ok) {
        reject(new Error(parsed.error));
        return;
      }
      resolve(parsed.slugs);
    }

    window.addEventListener("message", onMessage);
    window.postMessage({ type: HISTORY_REQUEST_TYPE, requestId }, window.location.origin);
  });
}

async function runReconciliation(): Promise<HistoryReconcileResult> {
  const started = await chrome.runtime.sendMessage({ type: "progress:history-start" }) as ExtensionResponse;
  if (!started.ok) throw new Error(started.error);

  const slugs = await requestSolvedHistoryFromPage();
  const observedAt = new Date().toISOString();
  const response = await chrome.runtime.sendMessage({
    type: "progress:history-import",
    slugs,
    observedAt,
  }) as ExtensionResponse;
  if (!response.ok) throw new Error(response.error);
  return { imported: response.imported ?? 0, solvedCount: slugs.length };
}

export function reconcileSolvedHistory(): Promise<HistoryReconcileResult> {
  if (activeReconcile) return activeReconcile;
  activeReconcile = runReconciliation().finally(() => {
    activeReconcile = null;
  });
  return activeReconcile;
}
