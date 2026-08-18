import { describe, expect, it } from "vitest";
import type { ProblemProgress } from "@leet-progress/progress";
import type { CatalogProblem } from "@leet-progress/types";
import { recommendProblems } from "./recommend";

const problem = (slug: string, companies: string[], topics: string[], frequency: number): CatalogProblem => ({
  slug,
  title: slug.replaceAll("-", " "),
  url: `https://leetcode.com/problems/${slug}/`,
  difficulty: "MEDIUM",
  topics,
  observations: companies.map((company) => ({ company, window: "30d", frequency, acceptanceRate: 50 })),
});

const catalog = [
  problem("target-graph", ["Google", "Amazon"], ["Graph"], 95),
  problem("weak-dp", ["Meta"], ["Dynamic Programming"], 70),
  problem("revision-array", ["Google"], ["Array"], 80),
  problem("already-solved", ["Google"], ["Graph"], 100),
];

const progress: ProblemProgress[] = [
  { slug: "revision-array", status: "revision_due", attempts: 2, revisitCount: 1, revisionDueAt: "2026-08-18T10:00:00.000Z" },
  { slug: "already-solved", status: "solved", attempts: 1, revisitCount: 0, solvedAt: "2026-08-17T10:00:00.000Z" },
];

describe("recommendProblems", () => {
  it("ranks deterministically and always explains recommendations", () => {
    const input = { targetCompanies: ["Google"], progress, weakTopics: ["Dynamic Programming"], limit: 10 };
    const first = recommendProblems(catalog, input);
    const second = recommendProblems(catalog, input);
    expect(first).toEqual(second);
    expect(first.every((item) => item.reasons.length > 0)).toBe(true);
    expect(first.some((item) => item.slug === "already-solved")).toBe(false);
    expect(first.some((item) => item.slug === "revision-array" && item.reasons.includes("revision-due"))).toBe(true);
    expect(first.some((item) => item.slug === "weak-dp" && item.reasons.includes("weak-topic"))).toBe(true);
  });

  it("uses stable slug tie-breaking", () => {
    const same = [problem("b-problem", ["Google"], ["Array"], 50), problem("a-problem", ["Google"], ["Array"], 50)];
    expect(recommendProblems(same, { targetCompanies: ["Google"], progress: [] }).map((item) => item.slug)).toEqual(["a-problem", "b-problem"]);
  });
});
