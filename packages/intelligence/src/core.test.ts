import { describe, expect, it } from "vitest";
import type { CatalogProblem } from "@leet-progress/types";
import { companyOverlap, scoreProblemPriority, trendScore } from "./core";

const problem: CatalogProblem = {
  slug: "two-sum",
  title: "Two Sum",
  url: "https://leetcode.com/problems/two-sum/",
  difficulty: "EASY",
  topics: ["Array", "Hash Table"],
  observations: [
    { company: "Amazon", window: "90d", frequency: 60, acceptanceRate: 0.52 },
    { company: "Google", window: "30d", frequency: 90, acceptanceRate: 0.52 },
    { company: "Google", window: "6m", frequency: 45, acceptanceRate: 0.52 },
  ],
};

describe("shared intelligence", () => {
  it("computes deterministic target overlap", () => {
    expect(companyOverlap(problem, ["Microsoft", "Google", "Amazon", "Google"])).toEqual({
      matchingCompanies: ["Amazon", "Google"],
      count: 2,
      total: 3,
      ratio: 2 / 3,
    });
  });

  it("detects a positive trend when recent frequency exceeds baseline", () => {
    expect(trendScore(problem.observations)).toBeGreaterThan(50);
  });

  it("returns stable score, tier, components and reason ordering", () => {
    const context = {
      targetCompanies: ["Google", "Amazon", "Microsoft"],
      solved: false,
      revisionDue: true,
      planRelevant: true,
      weakTopicMatches: 2,
    };
    const first = scoreProblemPriority(problem, context);
    const second = scoreProblemPriority(problem, context);
    expect(first).toEqual(second);
    expect(first.version).toBe("priority-v1");
    expect(first.score).toBeGreaterThan(0);
    expect(Object.keys(first.components)).toContain("targetOverlap");
    expect(first.reasons.length).toBeGreaterThan(0);
    expect(first.reasons.map((reason) => reason.weight)).toEqual(
      [...first.reasons.map((reason) => reason.weight)].sort((a, b) => b - a),
    );
  });
});
