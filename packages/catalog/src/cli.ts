import path from "node:path";
import { buildCatalogArtifacts } from "./build";

const frontendDir = process.cwd();
const rootDir = path.resolve(frontendDir, "..");
const result = buildCatalogArtifacts({
  rootDir,
  webDataDir: path.join(frontendDir, "src", "data"),
  extensionArtifactPath: path.join(rootDir, "artifacts", "catalog", "extension-catalog.json"),
});

console.log(
  `Catalog V2: ${result.metadata.sourceRows} rows → ${result.metadata.uniqueProblems} problems across ${result.metadata.companies} companies (${result.metadata.catalogVersion})`,
);
