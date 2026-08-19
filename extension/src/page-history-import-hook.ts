import { fetchSolvedHistorySlugs } from "./history-query";

const REQUEST_TYPE = "LEET_PROGRESS_HISTORY_REQUEST";
const RESULT_TYPE = "LEET_PROGRESS_HISTORY_RESULT";

type HistoryHookWindow = {
  __leetProgressHistoryHookInstalled__?: boolean;
  location: { origin: string };
  addEventListener(type: "message", listener: (event: MessageEvent) => void): void;
  postMessage(message: unknown, targetOrigin: string): void;
};

export function installHistoryImportHook(
  target: HistoryHookWindow = window,
  fetchSlugs: () => Promise<string[]> = fetchSolvedHistorySlugs,
): void {
  if (target.__leetProgressHistoryHookInstalled__) return;
  target.__leetProgressHistoryHookInstalled__ = true;
  let running = false;

  function respond(requestId: string, payload: Record<string, unknown>) {
    target.postMessage({ type: RESULT_TYPE, version: 1, requestId, ...payload }, target.location.origin);
  }

  target.addEventListener("message", (event) => {
    if (event.source !== target as unknown as MessageEventSource || event.origin !== target.location.origin) return;
    const data = event.data as { type?: unknown; requestId?: unknown };
    if (data?.type !== REQUEST_TYPE || typeof data.requestId !== "string" || !data.requestId) return;
    const requestId = data.requestId;
    if (running) {
      respond(requestId, { ok: false, error: "history-import-already-running" });
      return;
    }

    running = true;
    void fetchSlugs()
      .then((slugs) => respond(requestId, { ok: true, slugs }))
      .catch((error) => {
        respond(requestId, { ok: false, error: error instanceof Error ? error.message : "history-import-failed" });
      })
      .finally(() => {
        running = false;
      });
  });
}

if (typeof window !== "undefined") installHistoryImportHook(window);
