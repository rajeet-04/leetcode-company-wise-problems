import { LEET_PROGRESS_WEBSITE_ORIGIN, SYNC_REQUEST_NAMESPACE, SYNC_RESPONSE_NAMESPACE } from "./website-bridge-policy";

if (location.origin === LEET_PROGRESS_WEBSITE_ORIGIN) {
  window.addEventListener("message", (event) => {
    if (event.source !== window || event.origin !== LEET_PROGRESS_WEBSITE_ORIGIN) return;
    const data = event.data as { namespace?: unknown; requestId?: unknown; type?: unknown };
    if (data?.namespace !== SYNC_REQUEST_NAMESPACE || typeof data.requestId !== "string" || data.type !== "sync:exchange") return;
    void Promise.resolve().then(() => chrome.runtime.sendMessage({ ...data, namespace: undefined, requestId: undefined })).then((response) => {
      window.postMessage({ namespace: SYNC_RESPONSE_NAMESPACE, requestId: data.requestId, ...(response as object) }, LEET_PROGRESS_WEBSITE_ORIGIN);
    }).catch(() => {
      window.postMessage({ namespace: SYNC_RESPONSE_NAMESPACE, requestId: data.requestId, ok: false, error: "Extension bridge unavailable" }, LEET_PROGRESS_WEBSITE_ORIGIN);
    });
  });
}
