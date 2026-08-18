import catalog from "./catalog-v2.json";
import type { CatalogProblem } from "@leet-progress/types";

export const catalogV2Problems = catalog as unknown as CatalogProblem[];
export const catalogV2BySlug = new Map(catalogV2Problems.map((problem) => [problem.slug, problem] as const));
