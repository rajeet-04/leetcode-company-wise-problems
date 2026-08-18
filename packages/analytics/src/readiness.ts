import { calculateTopicReadiness, scoreProblemPriority } from "@leet-progress/intelligence";
import { isRevisionDue, type ProblemProgress } from "@leet-progress/progress";
import type { CatalogProblem } from "@leet-progress/types";

export type CompanyReadiness = {
  company: string;
  score: number;
  components: {
    highPriorityCoverage: number;
    topicCoverage: number;
    difficultyCoverage: number;
    revisionHealth: number;
  };
  problemCount: number;
  solvedCount: number;
};

export type PersonalAnalytics = {
  solvedTotal: number;
  solvedLast7Days: number;
  solvedLast30Days: number;
  attemptedProblems: number;
  totalAttempts: number;
  attemptBurden: number;
  revisionsDue: number;
  targetReadiness: CompanyReadiness[];
  topicReadiness: ReturnType<typeof calculateTopicReadiness>;
};

function solved(progress: ProblemProgress | undefined): boolean {
  return !!progress && ["solved", "revision_due", "mastered"].includes(progress.status);
}

function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function average(values: readonly number[]): number {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

export function calculateCompanyReadiness(
  catalog: readonly CatalogProblem[],
  progress: readonly ProblemProgress[],
  company: string,
  now: string,
): CompanyReadiness {
  const companyCatalog = catalog.filter((problem) => problem.observations.some((observation) => observation.company === company));
  const progressBySlug = new Map(progress.map((item) => [item.slug, item] as const));
  if (!companyCatalog.length) {
    return { company, score: 0, components: { highPriorityCoverage: 0, topicCoverage: 0, difficultyCoverage: 0, revisionHealth: 0 }, problemCount: 0, solvedCount: 0 };
  }

  const highPriority = companyCatalog.filter((problem) => scoreProblemPriority(problem, { targetCompanies: [company] }).score >= 65);
  const highPriorityCoverage = highPriority.length
    ? (highPriority.filter((problem) => solved(progressBySlug.get(problem.slug))).length / highPriority.length) * 100
    : 0;

  const topicRows = calculateTopicReadiness(companyCatalog, progress, [company]);
  const topicCoverage = average(topicRows.map((row) => row.score));

  const difficulties = [...new Set(companyCatalog.map((problem) => problem.difficulty).filter(Boolean))];
  const coveredDifficulties = difficulties.filter((difficulty) => companyCatalog.some((problem) => problem.difficulty === difficulty && solved(progressBySlug.get(problem.slug))));
  const difficultyCoverage = difficulties.length ? (coveredDifficulties.length / difficulties.length) * 100 : 0;

  const solvedRows = companyCatalog.map((problem) => progressBySlug.get(problem.slug)).filter((item): item is ProblemProgress => solved(item));
  const healthyRevisions = solvedRows.filter((item) => item.status === "mastered" || !isRevisionDue(item, now)).length;
  const revisionHealth = solvedRows.length ? (healthyRevisions / solvedRows.length) * 100 : 0;

  const components = {
    highPriorityCoverage: clampScore(highPriorityCoverage),
    topicCoverage: clampScore(topicCoverage),
    difficultyCoverage: clampScore(difficultyCoverage),
    revisionHealth: clampScore(revisionHealth),
  };
  const score = clampScore(
    components.highPriorityCoverage * 0.4 +
    components.topicCoverage * 0.25 +
    components.difficultyCoverage * 0.2 +
    components.revisionHealth * 0.15,
  );

  return {
    company,
    score,
    components,
    problemCount: companyCatalog.length,
    solvedCount: companyCatalog.filter((problem) => solved(progressBySlug.get(problem.slug))).length,
  };
}

export function calculatePersonalAnalytics(
  catalog: readonly CatalogProblem[],
  progress: readonly ProblemProgress[],
  targetCompanies: readonly string[],
  now: string,
): PersonalAnalytics {
  const nowMs = Date.parse(now);
  const solvedRows = progress.filter((item) => solved(item));
  const within = (value: string | undefined, days: number) => {
    if (!value || !Number.isFinite(nowMs)) return false;
    const timestamp = Date.parse(value);
    return Number.isFinite(timestamp) && timestamp <= nowMs && timestamp >= nowMs - days * 86_400_000;
  };
  const totalAttempts = progress.reduce((sum, item) => sum + item.attempts, 0);

  return {
    solvedTotal: solvedRows.length,
    solvedLast7Days: solvedRows.filter((item) => within(item.solvedAt, 7)).length,
    solvedLast30Days: solvedRows.filter((item) => within(item.solvedAt, 30)).length,
    attemptedProblems: progress.filter((item) => item.attempts > 0).length,
    totalAttempts,
    attemptBurden: progress.length ? Math.round((totalAttempts / progress.length) * 10) / 10 : 0,
    revisionsDue: progress.filter((item) => isRevisionDue(item, now)).length,
    targetReadiness: [...new Set(targetCompanies)].sort((a, b) => a.localeCompare(b)).map((company) => calculateCompanyReadiness(catalog, progress, company, now)),
    topicReadiness: calculateTopicReadiness(catalog, progress, targetCompanies),
  };
}
