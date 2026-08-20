import type { CatalogProblem } from "@leet-progress/types";
import { loadCachedCatalog, saveCachedCatalog } from "./catalog-cache";
import { parseRemoteCatalogMetadata, validateRemoteCatalog } from "./catalog-update";

export const PUBLIC_CATALOG_BASE = "https://leet.rajeet.in/catalog";
export const CATALOG_REFRESH_ALARM = "leet-progress-public-catalog-refresh";

export async function refreshPublicCatalog(): Promise<CatalogProblem[] | null> {
  const metadataResponse = await fetch(`${PUBLIC_CATALOG_BASE}/catalog-meta.json`, { cache: "no-store" });
  if (!metadataResponse.ok) throw new Error(`Catalog metadata fetch failed: ${metadataResponse.status}`);
  const metadata = parseRemoteCatalogMetadata(await metadataResponse.json());
  const existing = await loadCachedCatalog();
  if (existing?.catalogVersion === metadata.catalogVersion && existing.checksum === metadata.checksum) return existing.problems;

  const catalogResponse = await fetch(`${PUBLIC_CATALOG_BASE}/catalog.json`, { cache: "no-store" });
  if (!catalogResponse.ok) throw new Error(`Catalog fetch failed: ${catalogResponse.status}`);
  const json = await catalogResponse.text();
  const problems = await validateRemoteCatalog(metadata, json);
  await saveCachedCatalog({ catalogVersion: metadata.catalogVersion, checksum: metadata.checksum, problems, cachedAt: new Date().toISOString() });
  return problems;
}
