import { fetchSolvedHistorySlugs } from "./history-query";

const REQUEST_TYPE = "LEET_PROGRESS_HISTORY_REQUEST";
const RESULT_TYPE = "LEET_PROGRESS_HISTORY_RESULT";
let running = false;

function respond(requestId: string, payload: Record<string, unknown>) {
  window.postMessage({ type: RESULT_TYPE, version: 1, requestId, ...payload }, window.location.origin);
}

window.addEventListener("message", (event) => {
  if (event.source !== window || event.origin !== window.location.origin) return;
  const data = event.data as { type?: unknown; requestId?: unknown };
  if (data?.type !== REQUEST_TYPE || typeof data.requestId !== "string" || !data.requestId) return;
  const requestId = data.requestId;
  if (running) {
    respond(requestId, { ok: false, error: "history-import-already-running" });
    return;
  }

  running = true;
  void fetchSolvedHistorySlugs()
    .then((slugs) => respond(requestId, { ok: true, slugs }))
    .catch((error) => {
      respond(requestId, { ok: false, error: error instanceof Error ? error.message : "history-import-failed" });
    })
    .finally(() => {
      running = false;
    });
});
