import type { CatalogProblem } from "@leet-progress/types";

export function createCatalogIndex(problems: readonly CatalogProblem[]) {
  return new Map(problems.map((problem) => [problem.slug, problem] as const));
}

export function lookupCatalogProblem(index: ReadonlyMap<string, CatalogProblem>, slug: string) {
  return index.get(slug.toLowerCase()) ?? null;
}
