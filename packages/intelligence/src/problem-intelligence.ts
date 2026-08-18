import type { ProblemProgress } from "@leet-progress/progress";
import type { CatalogProblem } from "@leet-progress/types";
import {
  companyOverlap,
  recencyScore,
  scoreProblemPriority,
  sourceFrequencyScore,
  trendScore,
  type ScoreResult,
} from "./core";

export type ProblemIntelligence = {
  slug: string;
  companyCount: number;
  targetOverlap: ReturnType<typeof companyOverlap>;
  recency: number;
  trend: number;
  frequency: number;
  progressStatus: ProblemProgress["status"] | "unseen";
  priority: ScoreResult;
};

export type ProblemIntelligenceInput = {
  targetCompanies?: readonly string[];
  progress?: ProblemProgress | null;
  planRelevant?: boolean;
  weakTopicMatches?: number;
};

export function buildProblemIntelligence(
  problem: CatalogProblem,
  input: ProblemIntelligenceInput = {},
): ProblemIntelligence {
  const progress = input.progress ?? null;
  const targetCompanies = [...(input.targetCompanies ?? [])];
  const solved = !!progress && ["solved", "revision_due", "mastered"].includes(progress.status);
  const attempted = !!progress && (progress.status === "attempted" || progress.attempts > 0);
  const priority = scoreProblemPriority(problem, {
    targetCompanies,
    solved,
    attempted,
    revisionDue: progress?.status === "revision_due",
    planRelevant: input.planRelevant,
    weakTopicMatches: input.weakTopicMatches,
  });

  return {
    slug: problem.slug,
    companyCount: new Set(problem.observations.map((observation) => observation.company)).size,
    targetOverlap: companyOverlap(problem, targetCompanies),
    recency: recencyScore(problem.observations),
    trend: trendScore(problem.observations),
    frequency: sourceFrequencyScore(problem.observations),
    progressStatus: progress?.status ?? "unseen",
    priority,
  };
}
