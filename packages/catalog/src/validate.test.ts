import { describe, expect, it } from "vitest";
import type { CatalogMetadata, CatalogProblem } from "@leet-progress/types";
import { sha256 } from "./checksum";
import { validateCatalogArtifact } from "./validate";

const problems: CatalogProblem[] = [
  {
    slug: "two-sum",
    title: "Two Sum",
    url: "https://leetcode.com/problems/two-sum/",
    difficulty: "EASY",
    topics: ["Array", "Hash Table"],
    observations: [
      {
        company: "Google",
        window: "30d",
        frequency: 100,
        acceptanceRate: 0.52,
      },
    ],
  },
];

function metadata(overrides: Partial<CatalogMetadata> = {}): CatalogMetadata {
  const checksum = sha256(JSON.stringify(problems));
  return {
    schemaVersion: 2,
    catalogVersion: `v2-${checksum.slice(0, 16)}`,
    generatedAt: "2026-08-18T00:00:00.000Z",
    sourceRows: 1,
    uniqueProblems: 1,
    companies: 1,
    checksum,
    ...overrides,
  };
}

describe("validateCatalogArtifact", () => {
  it("accepts a valid artifact", () => {
    expect(validateCatalogArtifact(problems, metadata())).toEqual([]);
  });

  it("rejects wrong schema and count mismatch", () => {
    const issues = validateCatalogArtifact(problems, metadata({ schemaVersion: 1 as 2, uniqueProblems: 2 }));
    expect(issues).toContain("schemaVersion must be 2");
    expect(issues.some((issue) => issue.includes("uniqueProblems"))).toBe(true);
  });

  it("rejects duplicate observations", () => {
    const duplicate = structuredClone(problems);
    duplicate[0]!.observations.push({ ...duplicate[0]!.observations[0]! });
    const issues = validateCatalogArtifact(duplicate, metadata({ checksum: sha256(JSON.stringify(duplicate)) }));
    expect(issues.some((issue) => issue.includes("duplicate observation"))).toBe(true);
  });

  it("rejects non-finite numeric fields", () => {
    const invalid = structuredClone(problems);
    invalid[0]!.observations[0]!.frequency = Number.NaN;
    const issues = validateCatalogArtifact(invalid, metadata({ checksum: sha256(JSON.stringify(invalid)) }));
    expect(issues.some((issue) => issue.includes("invalid frequency"))).toBe(true);
  });

  it("rejects checksum mismatch", () => {
    expect(validateCatalogArtifact(problems, metadata({ checksum: "0".repeat(64) }))).toContain("checksum mismatch");
  });
});
