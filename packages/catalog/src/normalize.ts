import type {
  CatalogProblem,
  CatalogWindow,
  CompanyObservation,
} from "@leet-progress/types";
import type { CsvRecord } from "./parse-csv";

export type NormalizedCatalogRow = Omit<CatalogProblem, "observations"> & {
  observation: CompanyObservation;
};

function windowFromFilename(filename: string): CatalogWindow {
  const name = filename.toLowerCase();
  if (name.includes("more than six months")) return "older";
  if (name.includes("thirty")) return "30d";
  if (name.includes("three months")) return "90d";
  if (name.includes("six months")) return "6m";
  if (name.includes("all")) return "all";
  return "all";
}

function finiteNumber(value: string | undefined): number | null {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return null;
  const numeric = Number(trimmed);
  return Number.isFinite(numeric) ? numeric : null;
}

function slugFromLink(link: string | undefined): string | null {
  const match = String(link ?? "").match(/\/problems\/([^/?#]+)/i);
  const slug = match?.[1]?.trim().toLowerCase();
  return slug || null;
}

function normalizedDifficulty(
  value: string | undefined,
): CatalogProblem["difficulty"] {
  const difficulty = String(value ?? "").trim().toUpperCase();
  if (difficulty === "EASY" || difficulty === "MEDIUM" || difficulty === "HARD") {
    return difficulty;
  }
  return "";
}

function normalizedTopics(value: string | undefined): string[] {
  return [...new Set(
    String(value ?? "")
      .split(",")
      .map((topic) => topic.trim())
      .filter(Boolean),
  )].sort((a, b) => a.localeCompare(b));
}

export function normalizeRow(
  company: string,
  filename: string,
  row: CsvRecord,
): NormalizedCatalogRow | null {
  const title = String(row.Title ?? "").trim();
  const url = String(row.Link ?? "").trim();
  const slug = slugFromLink(url);

  if (!title || !url || !slug) return null;

  return {
    slug,
    title,
    url,
    difficulty: normalizedDifficulty(row.Difficulty),
    topics: normalizedTopics(row.Topics),
    observation: {
      company: company.trim(),
      window: windowFromFilename(filename),
      frequency: finiteNumber(row.Frequency),
      acceptanceRate: finiteNumber(row["Acceptance Rate"]),
    },
  };
}
