# Shared Core Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create reusable, deterministic domain packages that power both website and extension without duplicating business logic.

**Architecture:** Move catalog, intelligence, progress, recommendation, and analytics calculations into browser-safe TypeScript packages. Clients supply storage/UI/browser adapters only.

**Tech Stack:** TypeScript, Bun workspace, Node-based catalog generation, unit tests, JSON schema/versioned serialization.

**Spec:** `docs/agentic/PLAN.md`, `docs/agentic/shared/AGENT.md`.

## Global Constraints

- No DOM/browser globals in shared domain logic.
- User data remains local-only.
- Scores are deterministic and explainable.
- Catalog observations retain company + time window + frequency + acceptance metadata when source data provides it.
- Existing website behavior must remain functional during extraction.

---

## Phase S1 — Workspace extraction

### Deliverable

Establish shared package boundaries without changing runtime behavior.

### Planned packages

- `packages/types` — canonical domain interfaces and schema versions.
- `packages/catalog` — CSV parsing, normalization, catalog generation, metadata, validation.
- `packages/intelligence` — overlap, recency, trend, frequency and priority components.
- `packages/progress` — local user-state transitions and migrations.
- `packages/recommendations` — candidate generation, ranking and reasons.
- `packages/analytics` — readiness and personal analytics calculations.
- `packages/storage` — storage/mutation interfaces, not concrete browser implementations.

### Exit gate

Existing website imports shared search/filter types/functions and passes build/typecheck/tests with no duplicated replacement implementation left behind.

## Phase S2 — Catalog V2

### Required behavior

For each problem preserve observations such as:

```ts
export type CompanyObservation = {
  company: string;
  window: "30d" | "90d" | "6m" | "older" | "all";
  frequency: number | null;
  acceptanceRate: number | null;
};
```

Generate:

- canonical full catalog;
- compact extension catalog;
- catalog metadata with `schemaVersion`, `catalogVersion`, `generatedAt`, counts and checksum.

### Tests

Cover quoted CSV fields, CRLF/LF, missing columns, duplicate slugs, duplicate company/window observations, malformed links, empty frequency, deterministic ordering, and count reconciliation.

### Exit gate

Two consecutive catalog builds from identical inputs produce byte-stable normalized output or stable canonical hashes, and validator rejects malformed generated data.

## Phase S3 — Intelligence V1

Implement versioned score components:

- company reach;
- target-company overlap;
- recency;
- trend;
- source frequency;
- personal need;
- revision urgency;
- plan relevance.

Output shape:

```ts
export type ScoreResult = {
  version: string;
  score: number;
  tier: "low" | "medium" | "high" | "very-high";
  components: Record<string, number>;
  reasons: Array<{ code: string; weight: number; messageKey: string }>;
};
```

### Exit gate

Same catalog + same user state + same configuration always yields the same score and reason ordering.

## Phase S4 — Progress V2

Canonical states:

`unseen -> attempted -> solved -> revision_due -> mastered`

Support attempts, timestamps, confidence, revisit count, notes metadata, manual status changes and migration from existing solved slug sets.

### Exit gate

Migration is idempotent and preserves every currently solved slug.

## Phase S5 — Recommendations V1

Candidate pools:

- high target-company overlap;
- weak topics;
- revision due;
- same-pattern progression;
- active interview plan;
- unsolved high-priority.

Every result includes reason codes; tie-breaking is deterministic.

### Exit gate

Fixture-based rankings are stable and no recommendation is emitted without at least one explanation reason.

## Phase S6 — Readiness and personal analytics

Implement local calculations for:

- company readiness;
- topic readiness;
- priority coverage;
- difficulty coverage;
- revision health;
- study velocity;
- attempt burden;
- recommendation follow-through based on local events.

### Exit gate

All calculations run with networking disabled and require no identity/cloud state.
