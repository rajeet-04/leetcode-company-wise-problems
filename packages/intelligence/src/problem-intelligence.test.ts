import { describe, expect, it } from "vitest";
import type { CatalogProblem } from "@leet-progress/types";
import { buildProblemIntelligence } from "./problem-intelligence";

const problem: CatalogProblem = {
  slug: "two-sum", title: "Two Sum", url: "https://leetcode.com/problems/two-sum/", difficulty: "EASY", topics: ["Array", "Hash Table"],
  observations: [
    { company: "Google", window: "30d", frequency: 90, acceptanceRate: 50 },
    { company: "Amazon", window: "90d", frequency: 60, acceptanceRate: 50 },
  ],
};

describe("problem intelligence", () => {
  it("produces deterministic explainable components from shared state", () => {
    const input = { targetCompanies: ["Google", "Meta"], progress: { slug: "two-sum", status: "attempted" as const, attempts: 2, revisitCount: 0 } };
    const first = buildProblemIntelligence(problem, input);
    const second = buildProblemIntelligence(problem, input);
    expect(first).toEqual(second);
    expect(first.companyCount).toBe(2);
    expect(first.targetOverlap.matchingCompanies).toEqual(["Google"]);
    expect(first.priority.components.recency).toBe(100);
    expect(first.progressStatus).toBe("attempted");
    expect(first.priority.reasons.length).toBeGreaterThan(0);
  });
});
