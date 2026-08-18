import type { ProblemProgress } from "@leet-progress/progress";
import type { CatalogProblem } from "@leet-progress/types";
import { scoreProblemPriority } from "./core";

export type TopicReadiness = {
  topic: string;
  score: number;
  totalProblems: number;
  solvedProblems: number;
  attemptedProblems: number;
  level: "weak" | "developing" | "strong";
};

function earned(progress: ProblemProgress | undefined): number {
  if (!progress) return 0;
  if (progress.status === "mastered") return 1;
  if (progress.status === "solved") return 0.85;
  if (progress.status === "revision_due") return 0.65;
  if (progress.status === "attempted") return 0.25;
  return 0;
}

function level(score: number): TopicReadiness["level"] {
  if (score >= 75) return "strong";
  if (score >= 45) return "developing";
  return "weak";
}

export function calculateTopicReadiness(
  catalog: readonly CatalogProblem[],
  progress: readonly ProblemProgress[],
  targetCompanies: readonly string[] = [],
): TopicReadiness[] {
  const progressBySlug = new Map(progress.map((item) => [item.slug, item] as const));
  const topicMap = new Map<string, { weight: number; earned: number; totalProblems: number; solvedProblems: number; attemptedProblems: number }>();

  for (const problem of catalog) {
    const local = progressBySlug.get(problem.slug);
    const priority = scoreProblemPriority(problem, {
      targetCompanies: [...targetCompanies],
      solved: !!local && ["solved", "revision_due", "mastered"].includes(local.status),
      attempted: !!local && (local.status === "attempted" || local.attempts > 0),
      revisionDue: local?.status === "revision_due",
    });
    const weight = 1 + priority.score / 100;
    const credit = earned(local);
    for (const topic of problem.topics) {
      const current = topicMap.get(topic) ?? { weight: 0, earned: 0, totalProblems: 0, solvedProblems: 0, attemptedProblems: 0 };
      current.weight += weight;
      current.earned += weight * credit;
      current.totalProblems += 1;
      if (local && ["solved", "revision_due", "mastered"].includes(local.status)) current.solvedProblems += 1;
      if (local && local.attempts > 0) current.attemptedProblems += 1;
      topicMap.set(topic, current);
    }
  }

  return [...topicMap.entries()].map(([topic, value]) => {
    const score = value.weight ? Math.round((value.earned / value.weight) * 100) : 0;
    return { topic, score, totalProblems: value.totalProblems, solvedProblems: value.solvedProblems, attemptedProblems: value.attemptedProblems, level: level(score) };
  }).sort((a, b) => a.score - b.score || b.totalProblems - a.totalProblems || a.topic.localeCompare(b.topic));
}
