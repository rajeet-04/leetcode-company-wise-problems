import { reconcileSolvedHistory } from "./history-page-client";
import type { ExtensionResponse } from "./messages";

const PANEL_ID = "leet-progress-history-import";
let syncing = false;

function themeColors() {
  const dark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  return dark
    ? { background: "#171918", color: "#f5f5f2", muted: "rgba(255,255,255,.68)", buttonBg: "#f5f5f2", buttonColor: "#171717" }
    : { background: "#fbfbf9", color: "#171717", muted: "rgba(0,0,0,.58)", buttonBg: "#171717", buttonColor: "#fff" };
}

function createPanel() {
  const existing = document.getElementById(PANEL_ID);
  if (existing) return existing;

  const colors = themeColors();
  const panel = document.createElement("aside");
  panel.id = PANEL_ID;
  panel.setAttribute("aria-label", "Leet Progress solved history sync");
  Object.assign(panel.style, {
    position: "fixed",
    right: "14px",
    bottom: "14px",
    zIndex: "2147483647",
    width: "220px",
    padding: "10px 12px",
    borderRadius: "12px",
    background: colors.background,
    color: colors.color,
    boxShadow: "0 10px 28px rgba(0,0,0,.24)",
    fontFamily: "system-ui, sans-serif",
    border: "1px solid rgba(127,127,127,.22)",
  });

  const title = document.createElement("strong");
  title.textContent = "Leet Progress";
  title.style.display = "block";
  title.style.fontSize = "12px";

  const status = document.createElement("p");
  status.dataset.role = "status";
  Object.assign(status.style, { margin: "5px 0 0", fontSize: "11px", lineHeight: "1.4", color: colors.muted });

  const local = document.createElement("small");
  local.textContent = "Solved history stays in this browser.";
  Object.assign(local.style, { display: "block", marginTop: "5px", fontSize: "10px", color: colors.muted });

  const retry = document.createElement("button");
  retry.type = "button";
  retry.hidden = true;
  retry.textContent = "Retry solved-history sync";
  Object.assign(retry.style, {
    marginTop: "8px",
    width: "100%",
    border: "0",
    borderRadius: "999px",
    padding: "7px 9px",
    background: colors.buttonBg,
    color: colors.buttonColor,
    fontWeight: "700",
    cursor: "pointer",
  });

  retry.addEventListener("click", () => void runReconciliation(panel).catch(() => undefined));
  panel.append(title, status, local, retry);
  document.documentElement.append(panel);
  return panel;
}

async function runReconciliation(panel = createPanel()): Promise<void> {
  if (syncing) return;
  syncing = true;
  const status = panel.querySelector<HTMLElement>('[data-role="status"]');
  const retry = panel.querySelector<HTMLButtonElement>("button");
  if (status) status.textContent = "Syncing solved history…";
  if (retry) retry.hidden = true;

  try {
    const result = await reconcileSolvedHistory();
    if (status) status.textContent = result.imported > 0
      ? `Synced ${result.solvedCount} solved problems · ${result.imported} new`
      : `Solved history current · ${result.solvedCount} solved`;
    window.setTimeout(() => panel.remove(), 4000);
  } catch (error) {
    if (status) status.textContent = "Solved-history sync needs a retry.";
    if (retry) {
      retry.hidden = false;
      retry.title = error instanceof Error ? error.message : "history-reconcile-failed";
    }
    throw error;
  } finally {
    syncing = false;
  }
}

function initialize() {
  const panel = createPanel();
  void runReconciliation(panel).catch(() => undefined);
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if ((message as { type?: unknown } | null)?.type !== "progress:reconcile-now") return;
  const panel = createPanel();
  void runReconciliation(panel).then(
    () => sendResponse({ ok: true } satisfies ExtensionResponse),
    (error) => sendResponse({ ok: false, error: error instanceof Error ? error.message : "history-reconcile-failed" } satisfies ExtensionResponse),
  );
  return true;
});

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initialize, { once: true });
} else {
  initialize();
}
