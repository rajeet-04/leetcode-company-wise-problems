import { describe, expect, it } from "vitest";
import { applyBackup, createBackup, parseBackup } from "./backup";
import type { ProblemProgress } from "./state";

const progress: ProblemProgress[] = [
  { slug: "two-sum", status: "solved", attempts: 1, revisitCount: 0, solvedAt: "2026-08-01T00:00:00Z" },
  { slug: "lru-cache", status: "attempted", attempts: 2, revisitCount: 0, lastAttemptAt: "2026-08-17T00:00:00Z" },
];

describe("Leet Progress backup", () => {
  it("round-trips canonical local data", () => {
    const backup = createBackup(progress, { targetCompanies: ["Google", "Amazon", "Google"], dailyProblemGoal: 5 }, "2026-08-18T00:00:00Z");
    const parsed = parseBackup(JSON.parse(JSON.stringify(backup)));
    const restored = applyBackup([], { targetCompanies: [] }, parsed, "replace");
    expect(restored.progress).toEqual(progress.slice().sort((a, b) => a.slug.localeCompare(b.slug)));
    expect(restored.preferences).toEqual({ targetCompanies: ["Amazon", "Google"], dailyProblemGoal: 5 });
  });

  it("rejects malformed backups before writes", () => {
    expect(() => parseBackup({ format: "leet-progress-backup", formatVersion: 999 })).toThrow();
    const backup = createBackup(progress, { targetCompanies: [] }, "2026-08-18T00:00:00Z");
    expect(() => parseBackup({ ...backup, progress: [backup.progress[0], backup.progress[0]] })).toThrow(/duplicate slug/);
  });

  it("merges without deleting current-only progress", () => {
    const backup = createBackup(
      [{ slug: "two-sum", status: "mastered", attempts: 1, revisitCount: 2, masteredAt: "2026-08-18T00:00:00Z" }],
      { targetCompanies: ["Google"] },
      "2026-08-18T00:00:00Z",
    );
    const merged = applyBackup(progress, { targetCompanies: ["Amazon"] }, backup, "merge");
    expect(merged.progress.map((item) => item.slug)).toEqual(["lru-cache", "two-sum"]);
    expect(merged.progress.find((item) => item.slug === "two-sum")?.status).toBe("mastered");
    expect(merged.preferences.targetCompanies).toEqual(["Amazon", "Google"]);
  });
});
