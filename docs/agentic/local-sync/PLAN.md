# Local Website-Extension Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Synchronize website and extension personal state locally within the same browser profile with deterministic conflict handling and no cloud user-data service.

**Architecture:** Both clients maintain local replicas. Immutable mutations represent progress/history actions while versioned entity records represent user-editable settings such as plans, targets, confidence, and notes metadata. A content-script bridge on the approved Leet Progress origin relays messages to the extension service worker; both sides apply the same shared merge functions.

**Tech Stack:** TypeScript, IndexedDB, `chrome.storage.local`/extension IndexedDB adapter, extension messaging, page/content-script bridge, shared mutation/merge package.

**Spec:** `docs/agentic/local-sync/AGENT.md`, `docs/agentic/PLAN.md`.

## Global Constraints

- No backend user-data API.
- No `chrome.storage.sync`.
- No whole-state last-write-wins replacement during normal sync.
- Protocol is origin-restricted, versioned, idempotent, and resilient to partial exchange.
- Website and extension remain independently usable.

---

## Canonical mutation envelope

```ts
export type MutationEnvelope<TType extends string, TPayload> = {
  protocolVersion: 1;
  mutationId: string;
  installationId: string;
  source: "web" | "extension";
  type: TType;
  occurredAt: string;
  schemaVersion: number;
  payload: TPayload;
};
```

Core mutation families:

- `PROBLEM_ATTEMPTED`
- `PROBLEM_SOLVED`
- `PROBLEM_STATUS_SET`
- `REVISION_COMPLETED`
- `CONFIDENCE_SET`
- `TARGET_ADDED`
- `TARGET_REMOVED`
- `PLAN_CREATED`
- `PLAN_UPDATED`
- `PLAN_DELETED`
- `QUEUE_ITEM_PINNED`
- `QUEUE_ITEM_DEFERRED`

Sensitive free-form note content may use a versioned entity record rather than high-volume analytics-style events.

## Phase L1 — Shared protocol and merge library

Implement message types, validation, mutation identity, cursors/watermarks, idempotent application, entity version metadata and deterministic reducers.

**Exit gate:** Applying mutations in different delivery orders produces identical derived state for order-independent event types; duplicate delivery is a no-op.

## Phase L2 — Website replica

Implement IndexedDB stores for state, mutation log, applied mutation IDs, protocol metadata and backup metadata.

**Exit gate:** Website can reload and reconstruct identical state solely from its local persistence.

## Phase L3 — Extension replica

Implement equivalent logical stores through the extension storage adapter.

**Exit gate:** Extension restart preserves mutation log/cursor and derived state.

## Phase L4 — Bridge handshake

Handshake shape:

```ts
type SyncHello = {
  protocolVersion: 1;
  client: "web" | "extension";
  installationId: string;
  schemaVersions: Record<string, number>;
  latestMutationCursor: string | null;
};
```

The website page communicates only with its injected bridge content script; bridge communicates with the extension runtime. Validate origin and message namespace on every boundary.

**Exit gate:** Non-allowlisted origins cannot request personal state; mismatched protocol version returns a structured refusal without modifying state.

## Phase L5 — Incremental mutation exchange

Exchange only missing mutations after acknowledged cursors/IDs. Batch large histories. Acknowledge applied IDs after successful transaction.

**Exit gate:** Simulated interrupted sync resumes without duplicate effects or data loss.

## Phase L6 — Editable entity conflict rules

Use per-entity/per-field metadata where appropriate:

```ts
type VersionedField<T> = {
  value: T;
  updatedAt: string;
  mutationId: string;
};
```

Tie-break deterministic same-time conflicts by mutation ID; preserve tombstones for deletions until both replicas have acknowledged them.

**Exit gate:** Concurrent target/plan/preferences edits converge deterministically and deleted entities do not reappear after stale replica sync.

## Phase L7 — Live update push

When website is open and extension records a local event, push a bridge notification so website consumes the new mutation batch and recomputes derived state without reload. Reverse direction applies to website edits.

**Exit gate:** Fixture flow "Accepted on LeetCode -> website Today/readiness updates" succeeds locally with all network calls blocked except static catalog requests.

## Phase L8 — Backup/export/import

Versioned backup envelope contains schema metadata, personal records, mutation history needed for safe merge, and integrity checksum. Provide validation/preflight summary before import.

Modes:

- merge;
- replace after explicit confirmation;
- cancel/no-write.

**Exit gate:** Export -> clear local stores -> import round trip reproduces equivalent user state; malformed backup causes zero writes.

## Phase L9 — Compaction and storage growth

Define safe mutation compaction only after snapshots and acknowledgement rules prove older mutations are no longer needed for convergence. Never compact unacknowledged tombstones/history required for other replica reconciliation.

**Exit gate:** Large synthetic history compacts without changing derived state or breaking a stale-replica catch-up test.

## Phase L10 — Diagnostics

Expose local-only sync diagnostics: connection state, protocol version, last successful exchange, pending mutation count, last error category and manual resync. Do not log note bodies or unnecessary personal content.

**Exit gate:** Common failures are diagnosable without inspecting private payload contents.
