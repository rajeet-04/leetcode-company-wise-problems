import {
  SYNC_PROTOCOL_VERSION,
  SYNC_SCHEMA_VERSION,
  type ProgressMutation,
} from "@leet-progress/sync";

export const HISTORY_REQUEST_TYPE = "LEET_PROGRESS_HISTORY_REQUEST";
export const HISTORY_RESULT_TYPE = "LEET_PROGRESS_HISTORY_RESULT";

export type ParsedHistoryImportResult =
  | { ok: true; slugs: string[] }
  | { ok: false; error: string };

function normalizeSlugs(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(
    value
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim().toLowerCase())
      .filter((item) => /^[a-z0-9-]+$/.test(item)),
  )].sort((a, b) => a.localeCompare(b));
}

export function parseHistoryImportResult(value: unknown): ParsedHistoryImportResult {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { ok: false, error: "invalid-history-result" };
  }
  const result = value as Record<string, unknown>;
  if (result.type !== HISTORY_RESULT_TYPE || result.version !== 1 || typeof result.ok !== "boolean") {
    return { ok: false, error: "invalid-history-result" };
  }
  if (result.ok === false) {
    return {
      ok: false,
      error: typeof result.error === "string" && result.error.trim() ? result.error.trim() : "history-import-failed",
    };
  }
  if (!Array.isArray(result.slugs)) return { ok: false, error: "invalid-history-result" };
  return { ok: true, slugs: normalizeSlugs(result.slugs) };
}

export function createHistoryImportMutations(
  slugs: readonly string[],
  installationId: string,
  occurredAt: string,
): ProgressMutation[] {
  return normalizeSlugs(slugs).map((slug): ProgressMutation => ({
    protocolVersion: SYNC_PROTOCOL_VERSION,
    schemaVersion: SYNC_SCHEMA_VERSION,
    mutationId: `extension:history-import:${slug}`,
    installationId,
    source: "extension",
    type: "PROBLEM_SOLVED",
    occurredAt,
    payload: { slug },
  }));
}
