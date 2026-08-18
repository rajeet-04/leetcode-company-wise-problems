import {
  reduceProgress,
  type ProblemProgress,
  type ProgressStatus,
} from "@leet-progress/progress";

export const SYNC_PROTOCOL_VERSION = 1 as const;
export const SYNC_SCHEMA_VERSION = 1 as const;

export type SyncSource = "web" | "extension";

export type MutationEnvelope<TType extends string, TPayload> = {
  protocolVersion: typeof SYNC_PROTOCOL_VERSION;
  schemaVersion: typeof SYNC_SCHEMA_VERSION;
  mutationId: string;
  installationId: string;
  source: SyncSource;
  type: TType;
  occurredAt: string;
  payload: TPayload;
};

export type ProgressMutation =
  | MutationEnvelope<"PROBLEM_ATTEMPTED", { slug: string }>
  | MutationEnvelope<"PROBLEM_SOLVED", { slug: string }>
  | MutationEnvelope<"PROBLEM_STATUS_SET", { slug: string; status: ProgressStatus }>
  | MutationEnvelope<"PROBLEM_STATE_SET", { progress: ProblemProgress }>
  | MutationEnvelope<"CONFIDENCE_SET", { slug: string; confidence: 1 | 2 | 3 | 4 | 5 }>
  | MutationEnvelope<"NOTE_SET", { slug: string; note: string }>
  | MutationEnvelope<"REVISION_DUE", { slug: string; dueAt: string }>
  | MutationEnvelope<"PROBLEM_MASTERED", { slug: string }>
  | MutationEnvelope<"TARGETS_SET", { targetCompanies: string[] }>;

export type SyncHello = {
  protocolVersion: typeof SYNC_PROTOCOL_VERSION;
  client: SyncSource;
  installationId: string;
  schemaVersions: { progress: 1 };
  knownMutationIds: string[];
};

export type SyncExchange = {
  protocolVersion: typeof SYNC_PROTOCOL_VERSION;
  client: SyncSource;
  installationId: string;
  knownMutationIds: string[];
  mutations: ProgressMutation[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function validBase(value: Record<string, unknown>): boolean {
  return (
    value.protocolVersion === SYNC_PROTOCOL_VERSION &&
    value.schemaVersion === SYNC_SCHEMA_VERSION &&
    typeof value.mutationId === "string" && value.mutationId.length > 0 &&
    typeof value.installationId === "string" && value.installationId.length > 0 &&
    (value.source === "web" || value.source === "extension") &&
    typeof value.occurredAt === "string" && !Number.isNaN(Date.parse(value.occurredAt)) &&
    typeof value.type === "string" && isRecord(value.payload)
  );
}

function validSlug(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function validProgress(value: unknown): value is ProblemProgress {
  if (!isRecord(value)) return false;
  return validSlug(value.slug) &&
    ["unseen", "attempted", "solved", "revision_due", "mastered"].includes(String(value.status)) &&
    typeof value.attempts === "number" && Number.isFinite(value.attempts) && value.attempts >= 0 &&
    typeof value.revisitCount === "number" && Number.isFinite(value.revisitCount) && value.revisitCount >= 0;
}

function normalizeTargets(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

export function validateMutation(value: unknown): value is ProgressMutation {
  if (!isRecord(value) || !validBase(value)) return false;
  const payload = value.payload as Record<string, unknown>;
  switch (value.type) {
    case "PROBLEM_ATTEMPTED":
    case "PROBLEM_SOLVED":
    case "PROBLEM_MASTERED":
      return validSlug(payload.slug);
    case "PROBLEM_STATUS_SET":
      return validSlug(payload.slug) && ["unseen", "attempted", "solved", "revision_due", "mastered"].includes(String(payload.status));
    case "PROBLEM_STATE_SET":
      return validProgress(payload.progress);
    case "CONFIDENCE_SET":
      return validSlug(payload.slug) && [1, 2, 3, 4, 5].includes(Number(payload.confidence));
    case "NOTE_SET":
      return validSlug(payload.slug) && typeof payload.note === "string";
    case "REVISION_DUE":
      return validSlug(payload.slug) && typeof payload.dueAt === "string" && !Number.isNaN(Date.parse(payload.dueAt));
    case "TARGETS_SET":
      return Array.isArray(payload.targetCompanies) && payload.targetCompanies.every((company) => typeof company === "string" && company.trim().length > 0);
    default:
      return false;
  }
}

export function compareMutations(a: ProgressMutation, b: ProgressMutation): number {
  return a.occurredAt.localeCompare(b.occurredAt) || a.mutationId.localeCompare(b.mutationId);
}

export function mergeMutations(current: readonly ProgressMutation[], incoming: readonly ProgressMutation[]): ProgressMutation[] {
  const byId = new Map<string, ProgressMutation>();
  for (const mutation of [...current, ...incoming]) {
    if (!validateMutation(mutation)) continue;
    if (!byId.has(mutation.mutationId)) byId.set(mutation.mutationId, mutation);
  }
  return [...byId.values()].sort(compareMutations);
}

export function applyProgressMutations(existing: readonly ProblemProgress[], mutations: readonly ProgressMutation[]): ProblemProgress[] {
  const bySlug = new Map(existing.map((progress) => [progress.slug, { ...progress }]));
  for (const mutation of mergeMutations([], mutations)) {
    if (mutation.type === "TARGETS_SET") continue;
    if (mutation.type === "PROBLEM_STATE_SET") {
      bySlug.set(mutation.payload.progress.slug, { ...mutation.payload.progress });
      continue;
    }
    const slug = mutation.payload.slug;
    const current = bySlug.get(slug);
    switch (mutation.type) {
      case "PROBLEM_ATTEMPTED": bySlug.set(slug, reduceProgress(current, { type: "ATTEMPT", slug, at: mutation.occurredAt })); break;
      case "PROBLEM_SOLVED": bySlug.set(slug, reduceProgress(current, { type: "SOLVE", slug, at: mutation.occurredAt })); break;
      case "PROBLEM_STATUS_SET": bySlug.set(slug, reduceProgress(current, { type: "SET_STATUS", slug, at: mutation.occurredAt, status: mutation.payload.status })); break;
      case "CONFIDENCE_SET": bySlug.set(slug, reduceProgress(current, { type: "SET_CONFIDENCE", slug, at: mutation.occurredAt, confidence: mutation.payload.confidence })); break;
      case "NOTE_SET": bySlug.set(slug, reduceProgress(current, { type: "SET_NOTE", slug, at: mutation.occurredAt, note: mutation.payload.note })); break;
      case "REVISION_DUE": bySlug.set(slug, reduceProgress(current, { type: "REVISION_DUE", slug, at: mutation.occurredAt, dueAt: mutation.payload.dueAt })); break;
      case "PROBLEM_MASTERED": bySlug.set(slug, reduceProgress(current, { type: "MASTER", slug, at: mutation.occurredAt })); break;
    }
  }
  return [...bySlug.values()].sort((a, b) => a.slug.localeCompare(b.slug));
}

export function deriveTargetCompanies(mutations: readonly ProgressMutation[], fallback: readonly string[] = []): string[] {
  const latest = mergeMutations([], mutations).filter((mutation): mutation is Extract<ProgressMutation, { type: "TARGETS_SET" }> => mutation.type === "TARGETS_SET").at(-1);
  return normalizeTargets(latest?.payload.targetCompanies ?? fallback);
}

export function missingMutations(mutations: readonly ProgressMutation[], knownMutationIds: readonly string[]): ProgressMutation[] {
  const known = new Set(knownMutationIds);
  return mutations.filter((mutation) => !known.has(mutation.mutationId)).sort(compareMutations);
}

export function bootstrapProgressMutations(progress: readonly ProblemProgress[], installationId: string, source: SyncSource): ProgressMutation[] {
  return progress.map((record) => {
    const occurredAt = record.lastAttemptAt ?? record.solvedAt ?? record.masteredAt ?? record.firstSeenAt ?? new Date(0).toISOString();
    return { protocolVersion: SYNC_PROTOCOL_VERSION, schemaVersion: SYNC_SCHEMA_VERSION, mutationId: `${source}:bootstrap:${record.slug}:${occurredAt}`, installationId, source, type: "PROBLEM_STATE_SET", occurredAt, payload: { progress: { ...record } } };
  });
}

export function createTargetsMutation(targetCompanies: readonly string[], installationId: string, source: SyncSource, occurredAt: string, mutationId: string): ProgressMutation {
  return { protocolVersion: SYNC_PROTOCOL_VERSION, schemaVersion: SYNC_SCHEMA_VERSION, mutationId, installationId, source, type: "TARGETS_SET", occurredAt, payload: { targetCompanies: normalizeTargets(targetCompanies) } };
}
