import { buildProblemIntelligence } from "@leet-progress/intelligence";
import type { ProblemProgress } from "@leet-progress/progress";
import type { CatalogProblem } from "@leet-progress/types";

export type RecommendationReason =
  | "target-overlap"
  | "revision-due"
  | "weak-topic"
  | "same-pattern"
  | "active-plan"
  | "high-priority";

export type Recommendation = {
  slug: string;
  title: string;
  score: number;
  priorityScore: number;
  difficulty: CatalogProblem["difficulty"];
  reasons: RecommendationReason[];
};

export type RecommendationContext = {
  targetCompanies?: readonly string[];
  progress?: readonly ProblemProgress[];
  weakTopics?: readonly string[];
  currentProblem?: CatalogProblem | null;
  planSlugs?: readonly string[];
  limit?: number;
};

function solvedWithoutRevision(progress: ProblemProgress | undefined) {
  return !!progress && (progress.status === "solved" || progress.status === "mastered");
}

export function recommendProblems(
  catalog: readonly CatalogProblem[],
  context: RecommendationContext = {},
): Recommendation[] {
  const progressBySlug = new Map((context.progress ?? []).map((item) => [item.slug, item] as const));
  const weakTopics = new Set(context.weakTopics ?? []);
  const currentTopics = new Set(context.currentProblem?.topics ?? []);
  const planSlugs = new Set(context.planSlugs ?? []);
  const targetCompanies = [...(context.targetCompanies ?? [])];

  const ranked = catalog.flatMap((problem): Recommendation[] => {
    const progress = progressBySlug.get(problem.slug);
    if (solvedWithoutRevision(progress)) return [];

    const intelligence = buildProblemIntelligence(problem, { targetCompanies, progress });
    const reasons: RecommendationReason[] = [];
    let score = intelligence.priority.score;

    if (intelligence.targetOverlap.count > 0) {
      reasons.push("target-overlap");
      score += Math.round(intelligence.targetOverlap.ratio * 20);
    }
    if (progress?.status === "revision_due") {
      reasons.push("revision-due");
      score += 30;
    }
    if (problem.topics.some((topic) => weakTopics.has(topic))) {
      reasons.push("weak-topic");
      score += 15;
    }
    if (context.currentProblem && problem.slug !== context.currentProblem.slug && problem.topics.some((topic) => currentTopics.has(topic))) {
      reasons.push("same-pattern");
      score += 10;
    }
    if (planSlugs.has(problem.slug)) {
      reasons.push("active-plan");
      score += 20;
    }
    if (intelligence.priority.score >= 65) reasons.push("high-priority");

    if (!reasons.length) return [];
    return [{
      slug: problem.slug,
      title: problem.title,
      score,
      priorityScore: intelligence.priority.score,
      difficulty: problem.difficulty,
      reasons,
    }];
  });

  ranked.sort((a, b) => b.score - a.score || b.priorityScore - a.priorityScore || a.slug.localeCompare(b.slug));
  return ranked.slice(0, Math.max(0, context.limit ?? 12));
}
