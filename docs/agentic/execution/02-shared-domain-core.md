# Phase 02 — Shared Domain Core Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans or superpowers:subagent-driven-development. Follow TDD and checkpoint after each independently testable task.

**Goal:** Move filtering/search and deterministic intelligence contracts into shared packages while preserving the existing website API and behavior.

**Architecture:** `@leet-progress/intelligence` owns browser-safe filtering, overlap, trend and priority functions. `@leet-progress/progress` owns deterministic status transitions. `@leet-progress/storage` owns storage interfaces only. The frontend keeps a thin compatibility re-export.

**Tech Stack:** TypeScript, Vitest, Bun workspace, existing Next.js frontend.

**Spec:** `docs/agentic/PLAN.md` Phase 2 and `docs/agentic/shared/PLAN.md`.

## Global Constraints
- No DOM/browser globals in shared packages.
- No cloud/user-data networking.
- Existing website filters keep working.
- Default multi-company behavior remains ANY until UI exposes overlap mode.
- Relevance sorting becomes deterministic and meaningful.
- Scores/reasons are deterministic and explainable.

## Tasks

1. Add generic shared search/filter types and tests for query, company, difficulty, period, solved state, ANY/ALL company matching, relevance, title, company-count and semantic difficulty sorting.
2. Add company overlap and trend helpers with deterministic tests.
3. Add versioned priority score result/reason contracts and deterministic V1 scoring.
4. Add minimal progress state transition reducer and tests.
5. Add storage repository interfaces with no concrete browser implementation.
6. Replace `frontend/src/lib/search.ts` implementation with a compatibility re-export from the shared package.
7. Run `bun run test`, frontend route type generation, typecheck and production build.

## Exit gate
- Shared tests pass.
- Website consumes shared filtering with no duplicate search implementation.
- Same scoring input returns identical score/component/reason ordering.
- Existing website typecheck/build passes.
