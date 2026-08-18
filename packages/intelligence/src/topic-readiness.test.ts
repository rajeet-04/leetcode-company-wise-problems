import { describe, expect, it } from "vitest";
import type { ProblemProgress } from "@leet-progress/progress";
import type { CatalogProblem } from "@leet-progress/types";
import { calculateTopicReadiness } from "./topic-readiness";

const p = (slug: string, topic: string, company: string, frequency: number): CatalogProblem => ({
  slug, title: slug, url: `https://leetcode.com/problems/${slug}/`, difficulty: "MEDIUM", topics: [topic],
  observations: [{ company, window: "30d", frequency, acceptanceRate: 50 }],
});

const catalog = [p("graph-a", "Graph", "Google", 100), p("graph-b", "Graph", "Meta", 40), p("dp-a", "Dynamic Programming", "Google", 90)];
const progress: ProblemProgress[] = [
  { slug: "graph-a", status: "mastered", attempts: 1, revisitCount: 2 },
  { slug: "graph-b", status: "attempted", attempts: 3, revisitCount: 0 },
];

describe("calculateTopicReadiness", () => {
  it("weights target/high-value problems and is deterministic", () => {
    const first = calculateTopicReadiness(catalog, progress, ["Google"]);
    const second = calculateTopicReadiness(catalog, progress, ["Google"]);
    expect(first).toEqual(second);
    const graph = first.find((item) => item.topic === "Graph");
    const dp = first.find((item) => item.topic === "Dynamic Programming");
    expect(graph?.score).toBeGreaterThan(0);
    expect(graph?.score).toBeLessThan(100);
    expect(dp?.score).toBe(0);
    expect(graph?.totalProblems).toBe(2);
  });
});
