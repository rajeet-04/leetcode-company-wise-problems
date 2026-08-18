export const CATALOG_SCHEMA_VERSION = 2 as const;

export type CatalogWindow = "30d" | "90d" | "6m" | "older" | "all";

export type CompanyObservation = {
  company: string;
  window: CatalogWindow;
  frequency: number | null;
  acceptanceRate: number | null;
};

export type CatalogProblem = {
  slug: string;
  title: string;
  url: string;
  difficulty: "EASY" | "MEDIUM" | "HARD" | "";
  topics: string[];
  observations: CompanyObservation[];
};

export type CatalogMetadata = {
  schemaVersion: typeof CATALOG_SCHEMA_VERSION;
  catalogVersion: string;
  generatedAt: string;
  sourceRows: number;
  uniqueProblems: number;
  companies: number;
  checksum: string;
};
