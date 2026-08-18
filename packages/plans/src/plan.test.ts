import { describe, expect, it } from "vitest";
import type { ProblemProgress } from "@leet-progress/progress";
import type { CatalogProblem } from "@leet-progress/types";
import { buildAdaptivePlan, type InterviewPlan } from "./plan";

const p = (slug: string, company: string, topic: string, frequency: number): CatalogProblem => ({
  slug, title: slug, url: `https://leetcode.com/problems/${slug}/`, difficulty: "MEDIUM", topics: [topic],
  observations: [{ company, window: "30d", frequency, acceptanceRate: 50 }],
});
const catalog = [
  p("must", "Google", "Graph", 100),
  p("revision", "Google", "Array", 80),
  p("weak", "Meta", "Dynamic Programming", 70),
  p("pinned", "Meta", "String", 30),
  p("deferred", "Google", "Tree", 90),
];
const progress: ProblemProgress[] = [{ slug: "revision", status: "revision_due", attempts: 2, revisitCount: 1 }];
const plan: InterviewPlan = {
  id: "google-plan", name: "Google interview", targetCompanies: ["Google"], interviewDate: "2026-09-01", dailyProblemGoal: 3,
  difficultyPreference: "balanced", excludedTopics: [], pinnedSlugs: ["pinned"], deferredSlugs: ["deferred"], createdAt: "2026-08-18T00:00:00.000Z", updatedAt: "2026-08-18T00:00:00.000Z",
};

describe("buildAdaptivePlan", () => {
  it("builds deterministic buckets and preserves pin/defer overrides", () => {
    const first = buildAdaptivePlan(catalog, progress, plan, "2026-08-18T00:00:00.000Z");
    const second = buildAdaptivePlan(catalog, progress, plan, "2026-08-18T00:00:00.000Z");
    expect(first).toEqual(second);
    expect(first.buckets.revision).toContain("revision");
    expect(first.buckets.mustSolve).toContain("must");
    expect(first.dailyQueue[0]).toBe("pinned");
    expect(first.dailyQueue).not.toContain("deferred");
    expect(first.dailyQueue.length).toBeLessThanOrEqual(3);
    expect(first.daysRemaining).toBe(14);
  });
});
