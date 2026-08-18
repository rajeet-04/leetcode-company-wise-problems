import fs from "node:fs";
import path from "node:path";
import type { CatalogMetadata, CatalogProblem } from "@leet-progress/types";
import { assertValidCatalogArtifact } from "./validate";

function findRepositoryRoot(start: string): string {
  let current = path.resolve(start);
  while (true) {
    if (fs.existsSync(path.join(current, "frontend", "src", "data", "catalog-v2.json"))) {
      return current;
    }
    const parent = path.dirname(current);
    if (parent === current) throw new Error("Unable to locate repository root with catalog-v2.json");
    current = parent;
  }
}

const root = findRepositoryRoot(process.cwd());
const dataDir = path.join(root, "frontend", "src", "data");
const problems = JSON.parse(fs.readFileSync(path.join(dataDir, "catalog-v2.json"), "utf8")) as CatalogProblem[];
const metadata = JSON.parse(fs.readFileSync(path.join(dataDir, "catalog-meta.json"), "utf8")) as CatalogMetadata;

assertValidCatalogArtifact(problems, metadata);
console.log(`Catalog V2 valid: ${metadata.uniqueProblems} problems, ${metadata.companies} companies, ${metadata.catalogVersion}`);
