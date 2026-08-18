# Phase 01 — Catalog V2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current lossy merged catalog with a versioned canonical model that preserves company/time-window observations and generates validated web and extension artifacts.

**Architecture:** `@leet-progress/catalog` owns CSV parsing, file discovery, normalization, aggregation, artifact generation, metadata, and validation. The current `frontend/scripts/build-catalog.mjs` becomes a compatibility entry point that delegates to the package until later cleanup.

**Tech Stack:** TypeScript/Node APIs, Vitest, JSON artifacts, existing company CSV source directories.

**Spec:** `docs/agentic/shared/PLAN.md` Phase S2.

## Global Constraints

- Preserve source-company and source-window granularity.
- Do not infer missing frequency/acceptance values.
- Generated ordering must be deterministic.
- Public catalog contains no personal user data.
- Existing website must continue to receive a compatible catalog during migration.

---

### Task 1: Define Catalog V2 types

**Files:**
- Modify: `packages/types/src/index.ts`
- Create: `packages/types/src/catalog.ts`
- Create: `packages/types/src/catalog.test.ts`

**Interfaces:**
- Produces: `CatalogProblem`, `CompanyObservation`, `CatalogMetadata`, `CATALOG_SCHEMA_VERSION`.

- [ ] **Step 1: Write failing type/runtime contract test**

Create a test asserting exported schema version is `2` and a sample observation can be represented with `company`, `window`, `frequency`, and `acceptanceRate`.

- [ ] **Step 2: Run targeted test**

```bash
bunx vitest run packages/types/src/catalog.test.ts
```

Expected: FAIL because exports do not exist.

- [ ] **Step 3: Implement exact domain types**

```ts
export const CATALOG_SCHEMA_VERSION = 2 as const;

export type CatalogWindow = "30d" | "90d" | "6m" | "older" | "all";

export type CompanyObservation = {
  company: string;
  window: CatalogWindow;
  frequency: number | null;
  acceptanceRate: number | null;
};

export type CatalogProblem = {
  slug: string;
  title: string;
  url: string;
  difficulty: "EASY" | "MEDIUM" | "HARD" | "";
  topics: string[];
  observations: CompanyObservation[];
};

export type CatalogMetadata = {
  schemaVersion: typeof CATALOG_SCHEMA_VERSION;
  catalogVersion: string;
  generatedAt: string;
  sourceRows: number;
  uniqueProblems: number;
  companies: number;
  checksum: string;
};
```

Export these from `packages/types/src/index.ts`.

- [ ] **Step 4: Run test**

```bash
bunx vitest run packages/types/src/catalog.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/types
git commit -m "feat: define catalog v2 domain model"
```

### Task 2: Move CSV parser into catalog package

**Files:**
- Create: `packages/catalog/src/parse-csv.ts`
- Create: `packages/catalog/src/parse-csv.test.ts`
- Modify: `packages/catalog/src/index.ts`

**Interfaces:**
- Produces: `parseCsv(text: string): Array<Record<string, string>>`.

- [ ] **Step 1: Write parser fixtures**

Tests must cover comma-containing quoted topics, escaped quotes, CRLF, LF, blank rows, and missing trailing newline.

- [ ] **Step 2: Run parser tests and confirm failure**

```bash
bunx vitest run packages/catalog/src/parse-csv.test.ts
```

- [ ] **Step 3: Implement parser by extracting behavior from current builder**

Implementation must return trimmed header-keyed records and preserve commas inside quoted fields.

- [ ] **Step 4: Run parser tests**

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/catalog/src
git commit -m "refactor: extract deterministic csv parser"
```

### Task 3: Normalize source observations

**Files:**
- Create: `packages/catalog/src/normalize.ts`
- Create: `packages/catalog/src/normalize.test.ts`

**Interfaces:**
- Produces: `normalizeRow(company, filename, row): NormalizedCatalogRow | null`.

Normalization rules:

- Thirty Days -> `30d`
- Three Months -> `90d`
- Six Months -> `6m`
- More Than Six Months -> `older`
- All -> `all`
- LeetCode `/problems/<slug>/` -> normalized lowercase slug
- numeric strings -> finite number or `null`
- topics -> trimmed unique strings
- malformed/missing title or slug/link required for identity -> reject with validation issue rather than inventing user-facing identity

- [ ] **Step 1: Write normalization tests for every rule**
- [ ] **Step 2: Run and confirm failure**
- [ ] **Step 3: Implement minimal normalizer**
- [ ] **Step 4: Run targeted tests**
- [ ] **Step 5: Commit**

```bash
git add packages/catalog/src/normalize.ts packages/catalog/src/normalize.test.ts
git commit -m "feat: normalize catalog source observations"
```

### Task 4: Aggregate canonical problems without losing observations

**Files:**
- Create: `packages/catalog/src/aggregate.ts`
- Create: `packages/catalog/src/aggregate.test.ts`

**Interfaces:**
- Consumes: normalized rows.
- Produces: sorted `CatalogProblem[]` with deduplicated observations/topics.

- [ ] **Step 1: Write fixture with same slug across Google/Amazon and multiple windows**

Expected: one problem, every distinct observation retained, topics unioned, stable ordering.

- [ ] **Step 2: Confirm failing test**
- [ ] **Step 3: Implement deterministic aggregation**
- [ ] **Step 4: Run tests twice to confirm stable output**
- [ ] **Step 5: Commit**

```bash
git add packages/catalog/src/aggregate.ts packages/catalog/src/aggregate.test.ts
git commit -m "feat: aggregate catalog v2 observations"
```

### Task 5: Generate full and compact artifacts

**Files:**
- Create: `packages/catalog/src/build.ts`
- Create: `packages/catalog/src/checksum.ts`
- Create: `packages/catalog/src/build.test.ts`
- Modify: `frontend/scripts/build-catalog.mjs`

**Interfaces:**
- Produces:
  - `frontend/src/data/catalog-v2.json`
  - `frontend/src/data/catalog-meta.json`
  - `artifacts/catalog/extension-catalog.json`

Compact artifact may shorten representation but must preserve all fields required by extension intelligence.

- [ ] **Step 1: Write build fixture against temporary source tree**
- [ ] **Step 2: Confirm failure**
- [ ] **Step 3: Implement builder and SHA-256 checksum**
- [ ] **Step 4: Make legacy frontend catalog command delegate to new builder while retaining existing compatibility output until website migration consumes V2 directly**
- [ ] **Step 5: Run tests and current frontend catalog command**

```bash
bun run test
cd frontend
npm run catalog
```

- [ ] **Step 6: Commit**

```bash
git add packages/catalog frontend/scripts frontend/src/data artifacts/catalog
git commit -m "feat: generate catalog v2 artifacts"
```

### Task 6: Add artifact validator and CI gate

**Files:**
- Create: `packages/catalog/src/validate.ts`
- Create: `packages/catalog/src/validate.test.ts`
- Modify: `packages/catalog/package.json`
- Modify: `.github/workflows/sync-upstream-catalog.yml`

**Interfaces:**
- Produces: command that exits non-zero on schema/count/checksum/duplicate observation violations.

- [ ] **Step 1: Write invalid-artifact fixtures**

Cover wrong schema version, count mismatch, duplicate observation, invalid score-independent numeric field, and checksum mismatch.

- [ ] **Step 2: Confirm validator tests fail**
- [ ] **Step 3: Implement validator**
- [ ] **Step 4: Add CI command after catalog generation and before commit/push**
- [ ] **Step 5: Run complete verification**

```bash
bun run test
cd frontend
npm run catalog
bunx next typegen
bun run typecheck
bun run build
```

- [ ] **Step 6: Commit**

```bash
git add packages/catalog .github/workflows/sync-upstream-catalog.yml
git commit -m "ci: validate catalog v2 before publication"
```

## Phase exit verification

- `bun run test` passes.
- catalog command succeeds.
- validator succeeds on generated output.
- current website typecheck/build passes.
- catalog metadata reconciles source row count, unique problem count and company count.
- generated canonical output is deterministic for unchanged source input.
