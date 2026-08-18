import { describe, expect, it } from "vitest";
import { migrateLegacySolved, solvedSlugs } from "./migration";
import type { ProblemProgress } from "./state";

const existing: ProblemProgress[] = [
  { slug: "two-sum", status: "solved", attempts: 1, revisitCount: 0, solvedAt: "2026-01-01T00:00:00Z" },
  { slug: "course-schedule", status: "attempted", attempts: 2, revisitCount: 0 },
];

describe("legacy solved migration", () => {
  it("preserves existing records and imports every legacy solved slug", () => {
    const migrated = migrateLegacySolved(existing, ["two-sum", "course-schedule", "lru-cache"], "2026-08-18T00:00:00Z");
    expect([...solvedSlugs(migrated)].sort()).toEqual(["course-schedule", "lru-cache", "two-sum"]);
    expect(migrated.find((item) => item.slug === "course-schedule")?.attempts).toBe(2);
    expect(migrated.find((item) => item.slug === "two-sum")?.solvedAt).toBe("2026-01-01T00:00:00Z");
  });

  it("is idempotent", () => {
    const once = migrateLegacySolved(existing, ["two-sum", "lru-cache"], "2026-08-18T00:00:00Z");
    const twice = migrateLegacySolved(once, ["two-sum", "lru-cache"], "2026-08-19T00:00:00Z");
    expect(twice).toEqual(once);
  });
});
