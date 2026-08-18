# Phase 00 — Repository and Test Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prepare the repository for shared packages, website rework, and extension construction without changing current user-visible behavior.

**Architecture:** Introduce a Bun workspace at the repository root, move no production UI yet, add shared package scaffolds with explicit exports, and make current `frontend/` continue building while it begins consuming workspace packages.

**Tech Stack:** Bun 1.3.14, TypeScript 5, Next.js 16.3.1, React 19.2.8.

**Spec:** `docs/agentic/PLAN.md`, `docs/agentic/shared/PLAN.md`.

## Global Constraints

- Preserve current website behavior.
- No cloud user-data dependencies.
- No extension implementation in this phase.
- Do not move company CSV source directories.
- Keep `frontend/` operational until later website migration phases.

---

### Task 1: Add root Bun workspace

**Files:**
- Create: `package.json`
- Create: `tsconfig.base.json`
- Modify: `frontend/package.json`
- Test: existing frontend build/typecheck commands

**Interfaces:**
- Produces: workspace package resolution for `packages/*` and `frontend`.

- [ ] **Step 1: Record current baseline**

Run:

```bash
cd frontend
bun install --frozen-lockfile
bunx next typegen
bun run typecheck
bun run build
```

Expected: all commands pass before workspace changes.

- [ ] **Step 2: Create root `package.json`**

Create:

```json
{
  "name": "leet-progress-workspace",
  "private": true,
  "packageManager": "bun@1.3.14",
  "workspaces": ["frontend", "packages/*"]
}
```

- [ ] **Step 3: Create root TypeScript base config**

Create `tsconfig.base.json`:

```json
{
  "compilerOptions": {
    "strict": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "noUncheckedIndexedAccess": true
  }
}
```

- [ ] **Step 4: Reinstall from repository root**

Run:

```bash
bun install
```

Expected: workspace install succeeds and current frontend dependencies resolve.

- [ ] **Step 5: Re-run baseline verification**

Run:

```bash
cd frontend
bunx next typegen
bun run typecheck
bun run build
```

Expected: PASS with no behavior-related code changes.

- [ ] **Step 6: Commit**

```bash
git add package.json tsconfig.base.json frontend/package.json bun.lock frontend/bun.lock
git commit -m "build: establish leet progress workspace"
```

### Task 2: Create shared package shells

**Files:**
- Create: `packages/types/package.json`
- Create: `packages/types/src/index.ts`
- Create: `packages/catalog/package.json`
- Create: `packages/catalog/src/index.ts`
- Create: `packages/intelligence/package.json`
- Create: `packages/intelligence/src/index.ts`
- Create: `packages/progress/package.json`
- Create: `packages/progress/src/index.ts`
- Create: `packages/recommendations/package.json`
- Create: `packages/recommendations/src/index.ts`
- Create: `packages/analytics/package.json`
- Create: `packages/analytics/src/index.ts`
- Create: `packages/storage/package.json`
- Create: `packages/storage/src/index.ts`

**Interfaces:**
- Produces: importable browser-safe package boundaries; no production logic yet beyond exported version constants.

- [ ] **Step 1: Write a workspace import smoke test**

Create `packages/types/src/index.ts` with:

```ts
export const DOMAIN_SCHEMA_VERSION = 1 as const;
```

Then temporarily import it from a new lightweight script or test under `frontend/src/lib/__tests__/workspace-smoke.test.ts` using the repository's chosen test runner introduced in Task 3.

Expected assertion:

```ts
expect(DOMAIN_SCHEMA_VERSION).toBe(1);
```

- [ ] **Step 2: Add package manifests**

Each package manifest must be private, ESM, and export `./src/index.ts`. Example:

```json
{
  "name": "@leet-progress/types",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": "./src/index.ts"
}
```

Repeat with the matching package name for each package.

- [ ] **Step 3: Create empty typed exports for remaining packages**

Each `src/index.ts` should export one package version constant only, e.g.:

```ts
export const CATALOG_PACKAGE_VERSION = 1 as const;
```

Do not add domain logic in this task.

- [ ] **Step 4: Verify workspace resolution**

Run root install and the smoke test after Task 3 test harness exists.

- [ ] **Step 5: Commit**

```bash
git add packages
 git commit -m "build: add shared package boundaries"
```

### Task 3: Add shared test harness

**Files:**
- Modify: root `package.json`
- Create: `vitest.config.ts`
- Create: `packages/types/src/index.test.ts`

**Interfaces:**
- Produces: root `bun run test` command for shared package unit tests.

- [ ] **Step 1: Add failing shared test**

Create:

```ts
import { describe, expect, it } from "vitest";
import { DOMAIN_SCHEMA_VERSION } from "./index";

describe("domain package", () => {
  it("exposes the current schema version", () => {
    expect(DOMAIN_SCHEMA_VERSION).toBe(1);
  });
});
```

Run before installing Vitest:

```bash
bun run test
```

Expected: command missing/fails.

- [ ] **Step 2: Add Vitest dev dependency and root scripts**

Root scripts:

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

Install:

```bash
bun add -d vitest
```

- [ ] **Step 3: Run shared test**

```bash
bun run test
```

Expected: PASS.

- [ ] **Step 4: Verify frontend remains healthy**

```bash
cd frontend
bunx next typegen
bun run typecheck
bun run build
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add package.json bun.lock vitest.config.ts packages/types/src/index.test.ts
git commit -m "test: add shared package test harness"
```

## Phase exit verification

Run from repository root:

```bash
bun install
bun run test
cd frontend
bunx next typegen
bun run typecheck
bun run build
```

Expected: all PASS. No visible website behavior should change in Phase 00.
