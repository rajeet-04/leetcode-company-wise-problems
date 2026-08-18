import { describe, expect, it } from "vitest";
import type { ProblemProgress } from "@leet-progress/progress";
import type { CatalogProblem } from "@leet-progress/types";
import { calculateCompanyReadiness, calculatePersonalAnalytics } from "./readiness";

const p = (slug: string, company: string, difficulty: CatalogProblem["difficulty"], topic: string, frequency: number): CatalogProblem => ({ slug, title: slug, url: `https://leetcode.com/problems/${slug}/`, difficulty, topics: [topic], observations: [{ company, window: "30d", frequency, acceptanceRate: 50 }] });
const catalog = [p("easy","Google","EASY","Array",90),p("medium","Google","MEDIUM","Graph",100),p("hard","Google","HARD","Graph",80),p("other","Meta","MEDIUM","DP",90)];
const progress: ProblemProgress[] = [
  { slug:"easy",status:"mastered",attempts:1,revisitCount:1,solvedAt:"2026-08-12T00:00:00.000Z",masteredAt:"2026-08-17T00:00:00.000Z" },
  { slug:"medium",status:"solved",attempts:2,revisitCount:0,solvedAt:"2026-08-18T00:00:00.000Z",revisionDueAt:"2026-08-25T00:00:00.000Z" },
  { slug:"hard",status:"attempted",attempts:3,revisitCount:0,lastAttemptAt:"2026-08-18T00:00:00.000Z" },
];

describe("readiness analytics",()=>{
  it("returns deterministic explainable company components",()=>{
    const result=calculateCompanyReadiness(catalog,progress,"Google","2026-08-19T00:00:00.000Z");
    expect(result.company).toBe("Google");
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThan(100);
    expect(result.components.highPriorityCoverage).toBeGreaterThan(0);
    expect(result.components.difficultyCoverage).toBeGreaterThan(0);
    expect(result.components.topicCoverage).toBeGreaterThan(0);
    expect(result.components.revisionHealth).toBeGreaterThan(0);
    expect(calculateCompanyReadiness(catalog,progress,"Google","2026-08-19T00:00:00.000Z")).toEqual(result);
  });
  it("handles empty progress without NaN",()=>{
    const result=calculateCompanyReadiness(catalog,[],"Google","2026-08-19T00:00:00.000Z");
    expect(result.score).toBe(0);
    expect(Object.values(result.components).every(Number.isFinite)).toBe(true);
  });
  it("derives local solve velocity and attempt burden",()=>{
    const result=calculatePersonalAnalytics(catalog,progress,["Google"],"2026-08-19T00:00:00.000Z");
    expect(result.solvedTotal).toBe(2);
    expect(result.solvedLast7Days).toBe(2);
    expect(result.totalAttempts).toBe(6);
    expect(result.attemptBurden).toBe(2);
    expect(result.targetReadiness).toHaveLength(1);
  });
});
