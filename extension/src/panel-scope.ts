import { reconcileSolvedHistory } from "./history-page-client";
import type { ExtensionResponse } from "./messages";

const isProgressPage = () => location.pathname.startsWith("/progress");

async function configurePanel() {
  await chrome.runtime.sendMessage({ type: "panel:configure" });
}

async function reconcileIfPending() {
  if (isProgressPage()) return;
  const raw = await chrome.runtime.sendMessage({ type: "progress:history-status" }) as ExtensionResponse;
  if (!raw.ok || !raw.history?.needed) return;
  await reconcileSolvedHistory();
}

void configurePanel().catch(() => undefined);
void reconcileIfPending().catch(() => undefined);

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  const type = (message as { type?: unknown } | null)?.type;
  if (type !== "progress:reconcile-now" || isProgressPage()) return;
  void reconcileSolvedHistory().then(
    (result) => sendResponse({ ok: true, imported: result.imported }),
    (error) => sendResponse({ ok: false, error: error instanceof Error ? error.message : "history-reconcile-failed" }),
  );
  return true;
});
