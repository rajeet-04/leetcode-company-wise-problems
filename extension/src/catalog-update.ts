import type { CatalogProblem } from "@leet-progress/types";

export type RemoteCatalogMetadata = {
  schemaVersion: number;
  catalogVersion: string;
  checksum: string;
};

function hex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return hex(digest);
}

function validProblem(value: unknown): value is CatalogProblem {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const problem = value as Record<string, unknown>;
  return typeof problem.slug === "string" && problem.slug.length > 0 && typeof problem.title === "string" && Array.isArray(problem.topics) && Array.isArray(problem.observations);
}

export async function validateRemoteCatalog(metadata: RemoteCatalogMetadata, json: string): Promise<CatalogProblem[]> {
  if (metadata.schemaVersion !== 2) throw new Error(`Unsupported catalog schema: ${metadata.schemaVersion}`);
  if (!metadata.catalogVersion || !metadata.checksum) throw new Error("Catalog metadata is incomplete");
  const checksum = await sha256Hex(json);
  if (checksum !== metadata.checksum.toLowerCase()) throw new Error("Catalog checksum mismatch");
  const parsed = JSON.parse(json) as unknown;
  if (!Array.isArray(parsed) || !parsed.every(validProblem)) throw new Error("Catalog payload is invalid");
  return parsed;
}

export function parseRemoteCatalogMetadata(value: unknown): RemoteCatalogMetadata {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Catalog metadata is invalid");
  const metadata = value as Record<string, unknown>;
  if (typeof metadata.schemaVersion !== "number" || typeof metadata.catalogVersion !== "string" || typeof metadata.checksum !== "string") throw new Error("Catalog metadata is invalid");
  return { schemaVersion: metadata.schemaVersion, catalogVersion: metadata.catalogVersion, checksum: metadata.checksum };
}
