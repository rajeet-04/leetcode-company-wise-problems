import { HISTORY_REQUEST_TYPE, parseHistoryImportResult } from "./history-import";
import type { ExtensionResponse } from "./messages";

const PANEL_ID = "leet-progress-history-import";
let activeRequestId: string | null = null;

function createPanel() {
  if (document.getElementById(PANEL_ID)) return;
  const panel = document.createElement("aside");
  panel.id = PANEL_ID;
  panel.setAttribute("aria-label", "Leet Progress solved history import");
  Object.assign(panel.style, {
    position: "fixed",
    right: "20px",
    bottom: "20px",
    zIndex: "2147483647",
    width: "260px",
    padding: "14px",
    borderRadius: "14px",
    background: "#171717",
    color: "#fff",
    boxShadow: "0 12px 32px rgba(0,0,0,.28)",
    fontFamily: "system-ui, sans-serif",
  });

  const title = document.createElement("strong");
  title.textContent = "Leet Progress";
  title.style.display = "block";
  title.style.fontSize = "13px";

  const description = document.createElement("p");
  description.textContent = "Import your solved LeetCode history into this browser profile.";
  Object.assign(description.style, { margin: "6px 0 12px", fontSize: "12px", lineHeight: "1.45", color: "rgba(255,255,255,.68)" });

  const button = document.createElement("button");
  button.type = "button";
  button.textContent = "Import solved history";
  Object.assign(button.style, {
    width: "100%",
    border: "0",
    borderRadius: "999px",
    padding: "9px 12px",
    background: "#fff",
    color: "#171717",
    fontWeight: "700",
    cursor: "pointer",
  });

  button.addEventListener("click", () => {
    if (activeRequestId) return;
    activeRequestId = crypto.randomUUID();
    button.disabled = true;
    button.textContent = "Reading solved history…";
    window.postMessage({ type: HISTORY_REQUEST_TYPE, requestId: activeRequestId }, window.location.origin);
  });

  panel.append(title, description, button);
  document.documentElement.append(panel);
}

window.addEventListener("message", (event) => {
  if (event.source !== window || event.origin !== window.location.origin || !activeRequestId) return;
  const data = event.data as { requestId?: unknown };
  if (data?.requestId !== activeRequestId) return;

  const requestId = activeRequestId;
  activeRequestId = null;
  const parsed = parseHistoryImportResult(event.data);
  const button = document.querySelector<HTMLButtonElement>(`#${PANEL_ID} button`);
  if (!button) return;

  if (!parsed.ok) {
    button.disabled = false;
    button.textContent = "Retry solved history import";
    button.title = parsed.error;
    return;
  }

  button.textContent = "Saving locally…";
  void chrome.runtime.sendMessage({
    type: "progress:history-import",
    slugs: parsed.slugs,
    observedAt: new Date().toISOString(),
    requestId,
  }).then((response: ExtensionResponse) => {
    if (!response.ok) throw new Error(response.error);
    const imported = response.imported ?? parsed.slugs.length;
    button.disabled = false;
    button.textContent = imported > 0 ? `Imported ${imported} solved problems` : "Solved history already current";
    button.title = "Only solved problem slugs were stored locally.";
  }).catch((error) => {
    button.disabled = false;
    button.textContent = "Retry solved history import";
    button.title = error instanceof Error ? error.message : "history-import-failed";
  });
});

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", createPanel, { once: true });
} else {
  createPanel();
}
