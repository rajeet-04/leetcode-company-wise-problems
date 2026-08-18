# Phase 00 — Repository and Test Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prepare the repository for shared packages, website rework, and extension construction without changing current user-visible behavior.

**Architecture:** Introduce a Bun workspace at the repository root, add a shared test harness, then create shared package boundaries. Keep the current `frontend/` application operational throughout this phase.

**Tech Stack:** Bun 1.3.14, TypeScript 5, Next.js 16.3.1, React 19.2.8, Vitest.

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
git add package.json tsconfig.base.json bun.lock
git commit -m "build: establish leet progress workspace"
```

### Task 2: Add shared test harness

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `packages/types/src/index.ts`
- Create: `packages/types/src/index.test.ts`

**Interfaces:**
- Produces: root `bun run test` command and the first shared package export.

- [ ] **Step 1: Create the first shared export**

Create `packages/types/src/index.ts`:

```ts
export const DOMAIN_SCHEMA_VERSION = 1 as const;
```

- [ ] **Step 2: Write the failing shared test**

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

- [ ] **Step 3: Add Vitest dev dependency and root scripts**

Update root `package.json` scripts to include:

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

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["packages/**/*.test.ts"]
  }
});
```

- [ ] **Step 4: Run shared test**

```bash
bun run test
```

Expected: PASS.

- [ ] **Step 5: Verify frontend remains healthy**

```bash
cd frontend
bunx next typegen
bun run typecheck
bun run build
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add package.json bun.lock vitest.config.ts packages/types/src/index.ts packages/types/src/index.test.ts
git commit -m "test: add shared package test harness"
```

### Task 3: Create shared package shells

**Files:**
- Create: `packages/types/package.json`
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
- Create: `packages/types/src/workspace-smoke.test.ts`

**Interfaces:**
- Produces: importable browser-safe package boundaries; no production logic beyond version constants.

- [ ] **Step 1: Add package manifests**

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

- [ ] **Step 2: Create typed exports for remaining packages**

Each `src/index.ts` exports one version constant only. Example:

```ts
export const CATALOG_PACKAGE_VERSION = 1 as const;
```

Use corresponding constant names for intelligence, progress, recommendations, analytics, and storage. Do not add domain logic in this task.

- [ ] **Step 3: Add workspace smoke test**

Create `packages/types/src/workspace-smoke.test.ts` that imports all package version constants by package name and asserts each equals `1`.

- [ ] **Step 4: Verify workspace package resolution**

Run:

```bash
bun install
bun run test
```

Expected: PASS including workspace smoke test.

- [ ] **Step 5: Verify frontend remains healthy**

```bash
cd frontend
bunx next typegen
bun run typecheck
bun run build
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages bun.lock
git commit -m "build: add shared package boundaries"
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
