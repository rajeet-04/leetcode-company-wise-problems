import { reduceProgress, type ProblemProgress } from "./state";

export const PROGRESS_SCHEMA_VERSION = 2 as const;
export const LEGACY_SOLVED_STORAGE_KEY = "leet-progress-solved";

export type ProgressSnapshot = {
  schemaVersion: typeof PROGRESS_SCHEMA_VERSION;
  problems: ProblemProgress[];
};

export function migrateLegacySolved(
  existing: readonly ProblemProgress[],
  legacySolved: readonly string[],
  migratedAt: string,
): ProblemProgress[] {
  const bySlug = new Map(existing.map((item) => [item.slug, { ...item }]));

  for (const raw of legacySolved) {
    const slug = String(raw).trim();
    if (!slug) continue;
    const current = bySlug.get(slug);
    if (current?.status === "solved" || current?.status === "revision_due" || current?.status === "mastered") continue;
    bySlug.set(slug, reduceProgress(current, { type: "SOLVE", slug, at: migratedAt }));
  }

  return [...bySlug.values()].sort((a, b) => a.slug.localeCompare(b.slug));
}

export function solvedSlugs(progress: readonly ProblemProgress[]): Set<string> {
  return new Set(
    progress
      .filter((item) => item.status === "solved" || item.status === "revision_due" || item.status === "mastered")
      .map((item) => item.slug),
  );
}
