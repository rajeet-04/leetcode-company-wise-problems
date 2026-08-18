import { describe, expect, it } from "vitest";
import type { ProblemProgress } from "./state";
import { isRevisionDue, scheduleNextRevision } from "./revision";

const progress: ProblemProgress = { slug: "two-sum", status: "solved", attempts: 2, revisitCount: 0, confidence: 3 };

describe("revision schedule", () => {
  it("schedules deterministically and gives high-priority problems sooner review", () => {
    const low = scheduleNextRevision(progress, "2026-08-18T00:00:00.000Z", 20);
    const high = scheduleNextRevision(progress, "2026-08-18T00:00:00.000Z", 95);
    expect(high.intervalDays).toBeLessThan(low.intervalDays);
    expect(high.dueAt).toBe("2026-08-25T00:00:00.000Z");
    expect(scheduleNextRevision(progress, "2026-08-18T00:00:00.000Z", 95)).toEqual(high);
  });

  it("recognizes due dates and ignores mastered progress", () => {
    expect(isRevisionDue({ ...progress, revisionDueAt: "2026-08-17T00:00:00.000Z" }, "2026-08-18T00:00:00.000Z")).toBe(true);
    expect(isRevisionDue({ ...progress, status: "mastered", revisionDueAt: "2026-08-17T00:00:00.000Z" }, "2026-08-18T00:00:00.000Z")).toBe(false);
  });
});
