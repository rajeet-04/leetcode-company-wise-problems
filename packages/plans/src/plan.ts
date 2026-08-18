import { buildProblemIntelligence, calculateTopicReadiness } from "@leet-progress/intelligence";
import type { ProblemProgress } from "@leet-progress/progress";
import { recommendProblems } from "@leet-progress/recommendations";
import type { CatalogProblem } from "@leet-progress/types";

export type InterviewPlan = {
  id: string;
  name: string;
  targetCompanies: string[];
  interviewDate?: string;
  dailyProblemGoal: number;
  difficultyPreference: "balanced" | "easy-medium" | "medium-hard";
  excludedTopics: string[];
  pinnedSlugs: string[];
  deferredSlugs: string[];
  createdAt: string;
  updatedAt: string;
};

export type AdaptivePlan = {
  planId: string;
  daysRemaining: number | null;
  weakTopics: string[];
  buckets: {
    mustSolve: string[];
    highPriority: string[];
    revision: string[];
    weakArea: string[];
    optional: string[];
  };
  dailyQueue: string[];
};

function unique(values: readonly string[]): string[] {
  return [...new Set(values)];
}

function daysUntil(date: string | undefined, now: string): number | null {
  if (!date) return null;
  const end = Date.parse(`${date}T00:00:00.000Z`);
  const start = Date.parse(now);
  if (!Number.isFinite(end) || !Number.isFinite(start)) return null;
  return Math.max(0, Math.ceil((end - start) / 86_400_000));
}

export function buildAdaptivePlan(
  catalog: readonly CatalogProblem[],
  progress: readonly ProblemProgress[],
  plan: InterviewPlan,
  now: string,
): AdaptivePlan {
  const excluded = new Set(plan.excludedTopics);
  const deferred = new Set(plan.deferredSlugs);
  const filteredCatalog = catalog.filter((problem) => !problem.topics.some((topic) => excluded.has(topic)));
  const readiness = calculateTopicReadiness(filteredCatalog, progress, plan.targetCompanies);
  const weakTopics = readiness.filter((topic) => topic.score < 45 && topic.totalProblems > 0).map((topic) => topic.topic);
  const recommendations = recommendProblems(filteredCatalog, {
    targetCompanies: plan.targetCompanies,
    progress,
    weakTopics,
    limit: filteredCatalog.length,
  });
  const progressBySlug = new Map(progress.map((item) => [item.slug, item] as const));
  const catalogBySlug = new Map(filteredCatalog.map((problem) => [problem.slug, problem] as const));

  const revision: string[] = [];
  const mustSolve: string[] = [];
  const highPriority: string[] = [];
  const weakArea: string[] = [];
  const optional: string[] = [];

  for (const recommendation of recommendations) {
    if (deferred.has(recommendation.slug)) continue;
    const local = progressBySlug.get(recommendation.slug);
    const problem = catalogBySlug.get(recommendation.slug);
    if (!problem) continue;
    const intelligence = buildProblemIntelligence(problem, { targetCompanies: plan.targetCompanies, progress: local });
    if (local?.status === "revision_due" || recommendation.reasons.includes("revision-due")) revision.push(recommendation.slug);
    if (intelligence.targetOverlap.count > 0 && intelligence.recency >= 80 && intelligence.frequency >= 85) mustSolve.push(recommendation.slug);
    else if (recommendation.priorityScore >= 65) highPriority.push(recommendation.slug);
    if (recommendation.reasons.includes("weak-topic")) weakArea.push(recommendation.slug);
    if (recommendation.priorityScore < 65 && !recommendation.reasons.includes("weak-topic")) optional.push(recommendation.slug);
  }

  const pinned = plan.pinnedSlugs.filter((slug) => !deferred.has(slug) && catalogBySlug.has(slug));
  const dailyQueue = unique([...pinned, ...revision, ...mustSolve, ...weakArea, ...highPriority, ...optional])
    .filter((slug) => !deferred.has(slug))
    .slice(0, Math.max(1, plan.dailyProblemGoal));

  return {
    planId: plan.id,
    daysRemaining: daysUntil(plan.interviewDate, now),
    weakTopics,
    buckets: {
      mustSolve: unique(mustSolve),
      highPriority: unique(highPriority),
      revision: unique(revision),
      weakArea: unique(weakArea),
      optional: unique(optional),
    },
    dailyQueue,
  };
}
