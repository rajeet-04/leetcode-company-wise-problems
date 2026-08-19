import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { DEFAULT_HISTORY_RECONCILE_STATE, markHistoryReconcileNeeded, markHistoryReconcileSuccess, normalizeHistoryReconcileState } from "./history-reconcile";

describe("history reconciliation", () => {
  it("keeps local pending/success metadata deterministic", () => {
    expect(normalizeHistoryReconcileState(null)).toEqual(DEFAULT_HISTORY_RECONCILE_STATE);
    const success = markHistoryReconcileSuccess(DEFAULT_HISTORY_RECONCILE_STATE, "2026-08-19T08:00:00.000Z", 339);
    expect(success).toEqual({ needed: false, lastReconciledAt: "2026-08-19T08:00:00.000Z", lastSolvedCount: 339 });
    expect(markHistoryReconcileNeeded(success)).toEqual({ ...success, needed: true });
  });

  it("auto-starts on Progress and never opens hidden tabs", () => {
    const progress = readFileSync(path.resolve(import.meta.dirname, "progress-import.ts"), "utf8");
    const worker = readFileSync(path.resolve(import.meta.dirname, "service-worker.ts"), "utf8");
    expect(progress).toContain("void runReconciliation(panel)");
    expect(progress).toContain('type !== "progress:reconcile-now"');
    expect(worker).toContain("chrome.runtime.onStartup.addListener");
    expect(worker).toContain('query({ url: "https://leetcode.com/*" })');
    expect(worker).not.toContain("chrome.tabs.create");
  });
});
