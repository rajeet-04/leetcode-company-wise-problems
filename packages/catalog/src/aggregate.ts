import type { CatalogProblem, CompanyObservation } from "@leet-progress/types";
import type { NormalizedCatalogRow } from "./normalize";

const WINDOW_ORDER = new Map([
  ["30d", 0],
  ["90d", 1],
  ["6m", 2],
  ["older", 3],
  ["all", 4],
]);

function observationKey(observation: CompanyObservation): string {
  return [
    observation.company,
    observation.window,
    observation.frequency ?? "null",
    observation.acceptanceRate ?? "null",
  ].join("\u0000");
}

function compareObservations(a: CompanyObservation, b: CompanyObservation): number {
  return (
    a.company.localeCompare(b.company) ||
    (WINDOW_ORDER.get(a.window) ?? 99) - (WINDOW_ORDER.get(b.window) ?? 99) ||
    (a.frequency ?? Number.NEGATIVE_INFINITY) -
      (b.frequency ?? Number.NEGATIVE_INFINITY) ||
    (a.acceptanceRate ?? Number.NEGATIVE_INFINITY) -
      (b.acceptanceRate ?? Number.NEGATIVE_INFINITY)
  );
}

export function aggregateCatalog(rows: NormalizedCatalogRow[]): CatalogProblem[] {
  const grouped = new Map<string, NormalizedCatalogRow[]>();

  for (const row of rows) {
    const group = grouped.get(row.slug) ?? [];
    group.push(row);
    grouped.set(row.slug, group);
  }

  return [...grouped.entries()]
    .map(([slug, group]) => {
      const stableRows = [...group].sort(
        (a, b) =>
          a.title.localeCompare(b.title) ||
          a.url.localeCompare(b.url) ||
          a.difficulty.localeCompare(b.difficulty) ||
          a.observation.company.localeCompare(b.observation.company) ||
          a.observation.window.localeCompare(b.observation.window),
      );
      const canonical = stableRows[0]!;
      const topics = [...new Set(stableRows.flatMap((row) => row.topics))].sort((a, b) =>
        a.localeCompare(b),
      );
      const observations = [...new Map(
        stableRows.map((row) => [observationKey(row.observation), row.observation]),
      ).values()].sort(compareObservations);

      return {
        slug,
        title: canonical.title,
        url: canonical.url,
        difficulty: canonical.difficulty,
        topics,
        observations,
      } satisfies CatalogProblem;
    })
    .sort((a, b) => a.title.localeCompare(b.title) || a.slug.localeCompare(b.slug));
}
