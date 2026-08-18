import type { CatalogMetadata, CatalogProblem } from "@leet-progress/types";
import { CATALOG_SCHEMA_VERSION } from "@leet-progress/types";
import { sha256 } from "./checksum";

export type CatalogMetadataWithCompatibility = CatalogMetadata & {
  mergedDuplicates?: number;
};

export function validateCatalogArtifact(
  problems: CatalogProblem[],
  metadata: CatalogMetadataWithCompatibility,
): string[] {
  const issues: string[] = [];

  if (metadata.schemaVersion !== CATALOG_SCHEMA_VERSION) {
    issues.push(`schemaVersion must be ${CATALOG_SCHEMA_VERSION}`);
  }
  if (metadata.uniqueProblems !== problems.length) {
    issues.push(`uniqueProblems ${metadata.uniqueProblems} does not match ${problems.length}`);
  }

  const companies = new Set<string>();
  const slugs = new Set<string>();

  for (const problem of problems) {
    if (!problem.slug || slugs.has(problem.slug)) {
      issues.push(`duplicate or empty slug: ${problem.slug || "<empty>"}`);
    }
    slugs.add(problem.slug);

    const observationKeys = new Set<string>();
    for (const observation of problem.observations) {
      companies.add(observation.company);
      const key = `${observation.company}\u0000${observation.window}`;
      if (observationKeys.has(key)) {
        issues.push(`duplicate observation: ${problem.slug}/${observation.company}/${observation.window}`);
      }
      observationKeys.add(key);

      if (observation.frequency !== null && !Number.isFinite(observation.frequency)) {
        issues.push(`invalid frequency: ${problem.slug}/${observation.company}/${observation.window}`);
      }
      if (observation.acceptanceRate !== null && !Number.isFinite(observation.acceptanceRate)) {
        issues.push(`invalid acceptanceRate: ${problem.slug}/${observation.company}/${observation.window}`);
      }
    }
  }

  if (metadata.companies !== companies.size) {
    issues.push(`companies ${metadata.companies} does not match ${companies.size}`);
  }

  const expectedChecksum = sha256(JSON.stringify(problems));
  if (metadata.checksum !== expectedChecksum) {
    issues.push("checksum mismatch");
  }
  if (metadata.catalogVersion !== `v2-${expectedChecksum.slice(0, 16)}`) {
    issues.push("catalogVersion does not match checksum");
  }
  if (metadata.sourceRows < metadata.uniqueProblems) {
    issues.push("sourceRows cannot be lower than uniqueProblems");
  }

  return issues;
}

export function assertValidCatalogArtifact(
  problems: CatalogProblem[],
  metadata: CatalogMetadataWithCompatibility,
): void {
  const issues = validateCatalogArtifact(problems, metadata);
  if (issues.length > 0) {
    throw new Error(`Invalid Catalog V2 artifact:\n${issues.join("\n")}`);
  }
}
