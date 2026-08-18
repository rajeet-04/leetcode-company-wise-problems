import { describe, expect, it } from "vitest";
import { reduceProgress } from "./state";

describe("reduceProgress", () => {
  it("moves unseen to attempted and increments attempts", () => {
    const state = reduceProgress(undefined, { type: "ATTEMPT", slug: "two-sum", at: "2026-08-18T10:00:00Z" });
    expect(state).toMatchObject({ status: "attempted", attempts: 1, slug: "two-sum" });
  });

  it("solves without losing attempt history", () => {
    const attempted = reduceProgress(undefined, { type: "ATTEMPT", slug: "two-sum", at: "2026-08-18T10:00:00Z" });
    const solved = reduceProgress(attempted, { type: "SOLVE", slug: "two-sum", at: "2026-08-18T10:15:00Z" });
    expect(solved).toMatchObject({ status: "solved", attempts: 1, solvedAt: "2026-08-18T10:15:00Z" });
  });

  it("supports revision and mastery transitions deterministically", () => {
    const solved = reduceProgress(undefined, { type: "SOLVE", slug: "two-sum", at: "2026-08-18T10:00:00Z" });
    const due = reduceProgress(solved, { type: "REVISION_DUE", slug: "two-sum", at: "2026-08-20T10:00:00Z", dueAt: "2026-08-25T10:00:00Z" });
    const mastered = reduceProgress(due, { type: "MASTER", slug: "two-sum", at: "2026-08-25T10:00:00Z" });
    expect(due.status).toBe("revision_due");
    expect(mastered.status).toBe("mastered");
    expect(mastered.revisionDueAt).toBeUndefined();
  });
});
