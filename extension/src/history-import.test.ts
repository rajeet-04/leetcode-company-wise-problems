import { describe, expect, it } from "vitest";
import { mergeMutations } from "@leet-progress/sync";
import { createHistoryImportMutations, parseHistoryImportResult } from "./history-import";

describe("LeetCode history import", () => {
  it("validates and normalizes a successful page result", () => {
    const result = parseHistoryImportResult({
      type: "LEET_PROGRESS_HISTORY_RESULT",
      version: 1,
      ok: true,
      slugs: ["two-sum", " two-sum ", "add-two-numbers", "", 42],
    });
    expect(result).toEqual({ ok: true, slugs: ["add-two-numbers", "two-sum"] });
  });

  it("rejects malformed or failed page results without inventing slugs", () => {
    expect(parseHistoryImportResult({ type: "OTHER", ok: true, slugs: ["two-sum"] })).toEqual({ ok: false, error: "invalid-history-result" });
    expect(parseHistoryImportResult({ type: "LEET_PROGRESS_HISTORY_RESULT", version: 1, ok: false, error: "logged-out" })).toEqual({ ok: false, error: "logged-out" });
  });

  it("creates deterministic idempotent local solved mutations", () => {
    const first = createHistoryImportMutations(["two-sum", "add-two-numbers", "two-sum"], "extension-abc", "2026-08-19T05:00:00.000Z");
    const second = createHistoryImportMutations(["two-sum", "add-two-numbers"], "extension-abc", "2026-08-19T06:00:00.000Z");

    expect(first.map((mutation) => mutation.mutationId)).toEqual([
      "extension:history-import:add-two-numbers",
      "extension:history-import:two-sum",
    ]);
    expect(first.every((mutation) => mutation.type === "PROBLEM_SOLVED" && mutation.source === "extension")).toBe(true);
    expect(mergeMutations(first, second)).toHaveLength(2);
  });
});
