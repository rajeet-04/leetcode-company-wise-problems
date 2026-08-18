import { describe, expect, it } from "vitest";
import type { ProblemProgress } from "@leet-progress/progress";
import {
  applyProgressMutations,
  mergeMutations,
  validateMutation,
  type ProgressMutation,
} from "./index";

const mutation = (overrides: Partial<ProgressMutation> = {}): ProgressMutation => ({
  protocolVersion: 1,
  schemaVersion: 1,
  mutationId: "web:1",
  installationId: "web-install",
  source: "web",
  type: "PROBLEM_SOLVED",
  occurredAt: "2026-08-18T10:00:00.000Z",
  payload: { slug: "two-sum" },
  ...overrides,
} as ProgressMutation);

describe("local sync mutations", () => {
  it("deduplicates and deterministically sorts mutations", () => {
    const merged = mergeMutations([
      mutation({ mutationId: "b", occurredAt: "2026-08-18T11:00:00.000Z" }),
    ], [
      mutation({ mutationId: "a", occurredAt: "2026-08-18T10:00:00.000Z" }),
      mutation({ mutationId: "b", occurredAt: "2026-08-18T11:00:00.000Z" }),
    ]);
    expect(merged.map((item) => item.mutationId)).toEqual(["a", "b"]);
  });

  it("duplicate and reordered delivery converges to identical progress", () => {
    const events = [
      mutation({ mutationId: "1", type: "PROBLEM_ATTEMPTED", occurredAt: "2026-08-18T09:00:00.000Z", payload: { slug: "two-sum" } }),
      mutation({ mutationId: "2", type: "PROBLEM_SOLVED", occurredAt: "2026-08-18T10:00:00.000Z", payload: { slug: "two-sum" } }),
    ];
    const first = applyProgressMutations([], [...events, events[1]!]);
    const second = applyProgressMutations([], [...events].reverse());
    expect(first).toEqual(second);
    expect(first[0]?.status).toBe("solved");
  });

  it("applies a per-problem bootstrap state without replacing other records", () => {
    const existing: ProblemProgress[] = [{ slug: "three-sum", status: "solved", attempts: 1, revisitCount: 0, firstSeenAt: "2026-08-17T10:00:00.000Z", solvedAt: "2026-08-17T10:00:00.000Z" }];
    const bootstrap = mutation({ mutationId: "bootstrap", type: "PROBLEM_STATE_SET", payload: { progress: { slug: "two-sum", status: "solved", attempts: 0, revisitCount: 0, firstSeenAt: "2026-08-18T10:00:00.000Z", solvedAt: "2026-08-18T10:00:00.000Z" } } });
    expect(applyProgressMutations(existing, [bootstrap]).map((item) => item.slug)).toEqual(["three-sum", "two-sum"]);
  });

  it("rejects malformed protocol versions", () => {
    expect(validateMutation({ ...mutation(), protocolVersion: 2 })).toBe(false);
  });
});
