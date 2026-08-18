import type { CatalogProblem, CompanyObservation } from "@leet-progress/types";

export type ScoreTier = "low" | "medium" | "high" | "very-high";
export type ScoreReason = { code: string; weight: number; messageKey: string };
export type ScoreResult = {
  version: string;
  score: number;
  tier: ScoreTier;
  components: Record<string, number>;
  reasons: ScoreReason[];
};

export type PriorityContext = {
  targetCompanies?: string[];
  solved?: boolean;
  attempted?: boolean;
  revisionDue?: boolean;
  planRelevant?: boolean;
  weakTopicMatches?: number;
};

const WINDOW_WEIGHT: Record<CompanyObservation["window"], number> = {
  "30d": 1,
  "90d": 0.8,
  "6m": 0.55,
  older: 0.3,
  all: 0.2,
};

export function companyOverlap(
  problem: CatalogProblem,
  targetCompanies: readonly string[],
): { matchingCompanies: string[]; count: number; total: number; ratio: number } {
  const askedBy = new Set(problem.observations.map((observation) => observation.company));
  const uniqueTargets = [...new Set(targetCompanies)].sort((a, b) => a.localeCompare(b));
  const matchingCompanies = uniqueTargets.filter((company) => askedBy.has(company));
  return { matchingCompanies, count: matchingCompanies.length, total: uniqueTargets.length, ratio: uniqueTargets.length === 0 ? 0 : matchingCompanies.length / uniqueTargets.length };
}

export function recencyScore(observations: readonly CompanyObservation[]): number {
  if (observations.length === 0) return 0;
  return Math.round(Math.max(...observations.map((observation) => WINDOW_WEIGHT[observation.window])) * 100);
}

function averageFinite(values: Array<number | null>): number | null {
  const finite = values.filter((value): value is number => value !== null && Number.isFinite(value));
  if (finite.length === 0) return null;
  return finite.reduce((sum, value) => sum + value, 0) / finite.length;
}

export function trendScore(observations: readonly CompanyObservation[]): number {
  const recent = averageFinite(observations.filter((o) => o.window === "30d").map((o) => o.frequency));
  const baseline = averageFinite(observations.filter((o) => o.window === "90d" || o.window === "6m" || o.window === "older").map((o) => o.frequency));
  if (recent === null || baseline === null || recent === baseline) return 50;
  const denominator = Math.max(Math.abs(recent), Math.abs(baseline), 1);
  const normalized = (recent - baseline) / denominator;
  return Math.max(0, Math.min(100, Math.round(50 + normalized * 50)));
}

export function sourceFrequencyScore(observations: readonly CompanyObservation[]): number {
  const values = observations.map((o) => o.frequency).filter((value): value is number => value !== null && Number.isFinite(value));
  if (values.length === 0) return 0;
  return Math.max(0, Math.min(100, Math.round(Math.max(...values))));
}

function companyReachScore(problem: CatalogProblem): number {
  const companies = new Set(problem.observations.map((observation) => observation.company)).size;
  return Math.min(100, Math.round((companies / 25) * 100));
}

function tier(score: number): ScoreTier {
  if (score >= 85) return "very-high";
  if (score >= 65) return "high";
  if (score >= 40) return "medium";
  return "low";
}

export function scoreProblemPriority(problem: CatalogProblem, context: PriorityContext = {}): ScoreResult {
  const overlap = companyOverlap(problem, context.targetCompanies ?? []);
  const components = {
    companyReach: companyReachScore(problem),
    targetOverlap: context.targetCompanies?.length ? Math.round(overlap.ratio * 100) : 0,
    recency: recencyScore(problem.observations),
    trend: trendScore(problem.observations),
    frequency: sourceFrequencyScore(problem.observations),
    personalNeed: context.solved ? 0 : context.attempted ? 70 : 100,
    revisionUrgency: context.revisionDue ? 100 : 0,
    planRelevance: context.planRelevant ? 100 : 0,
    weakTopic: Math.min(100, Math.max(0, (context.weakTopicMatches ?? 0) * 25)),
  };

  const weights: Record<keyof typeof components, number> = {
    companyReach: 0.1,
    targetOverlap: context.targetCompanies?.length ? 0.2 : 0,
    recency: 0.15,
    trend: 0.1,
    frequency: 0.15,
    personalNeed: 0.15,
    revisionUrgency: 0.05,
    planRelevance: 0.05,
    weakTopic: 0.05,
  };
  const weightTotal = Object.values(weights).reduce((sum, value) => sum + value, 0);
  const raw = Object.entries(weights).reduce((sum, [key, weight]) => sum + components[key as keyof typeof components] * weight, 0);
  const score = Math.max(0, Math.min(100, Math.round(raw / weightTotal)));

  const reasons: ScoreReason[] = [];
  if (overlap.count > 0) reasons.push({ code: "target-overlap", weight: components.targetOverlap, messageKey: "priority.targetOverlap" });
  if (components.recency >= 80) reasons.push({ code: "recent-activity", weight: components.recency, messageKey: "priority.recentActivity" });
  if (components.frequency >= 70) reasons.push({ code: "high-frequency", weight: components.frequency, messageKey: "priority.highFrequency" });
  if (components.trend >= 65) reasons.push({ code: "trending", weight: components.trend, messageKey: "priority.trending" });
  if (!context.solved) reasons.push({ code: "unsolved", weight: components.personalNeed, messageKey: "priority.unsolved" });
  if (context.revisionDue) reasons.push({ code: "revision-due", weight: 100, messageKey: "priority.revisionDue" });
  if (context.planRelevant) reasons.push({ code: "plan-relevant", weight: 100, messageKey: "priority.planRelevant" });
  if ((context.weakTopicMatches ?? 0) > 0) reasons.push({ code: "weak-topic", weight: components.weakTopic, messageKey: "priority.weakTopic" });
  reasons.sort((a, b) => b.weight - a.weight || a.code.localeCompare(b.code));

  return { version: "priority-v1", score, tier: tier(score), components, reasons };
}
