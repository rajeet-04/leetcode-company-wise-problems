import { classifySubmissionPayload, isLikelySubmissionResponseUrl, submissionFingerprint } from "./submission-observer";

const NAMESPACE = "LEET_PROGRESS_SUBMISSION_OBSERVED";
const seen = new Set<string>();

function inspectPayload(payload: unknown) {
  const outcome = classifySubmissionPayload(payload);
  if (!outcome) return;
  const fingerprint = submissionFingerprint(payload);
  if (seen.has(fingerprint)) return;
  seen.add(fingerprint);
  window.postMessage({ namespace: NAMESPACE, fingerprint, outcome, observedAt: new Date().toISOString() }, location.origin);
}

function inspectResponse(response: Response) {
  if (!isLikelySubmissionResponseUrl(response.url)) return;
  void response.clone().json().then(inspectPayload).catch(() => undefined);
}

const originalFetch = window.fetch.bind(window);
window.fetch = async (...args) => {
  const response = await originalFetch(...args);
  try { inspectResponse(response); } catch { /* LeetCode must remain unaffected. */ }
  return response;
};

const originalOpen = XMLHttpRequest.prototype.open;
const originalSend = XMLHttpRequest.prototype.send;
const xhrUrls = new WeakMap<XMLHttpRequest, string>();

XMLHttpRequest.prototype.open = function(method: string, url: string | URL, ...rest: unknown[]) {
  xhrUrls.set(this, String(url));
  return (originalOpen as (...args: unknown[]) => void).call(this, method, url, ...rest);
};

XMLHttpRequest.prototype.send = function(...args: unknown[]) {
  this.addEventListener("load", () => {
    const url = xhrUrls.get(this) ?? "";
    if (!isLikelySubmissionResponseUrl(url)) return;
    try {
      const payload = this.responseType === "json" ? this.response : JSON.parse(this.responseText);
      inspectPayload(payload);
    } catch { /* Ignore unrelated/non-JSON responses. */ }
  }, { once: true });
  return (originalSend as (...args: unknown[]) => void).apply(this, args);
};
