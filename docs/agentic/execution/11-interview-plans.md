# Phase 11 — Adaptive Interview Plans Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add local, synchronized interview plan definitions whose daily queue and must-solve/high/revision/weak/optional buckets recalculate deterministically as progress changes.

**Architecture:** `@leet-progress/plans` owns plan definitions and adaptive derivation using shared recommendations/topic readiness. `@leet-progress/sync` stores plan upsert/delete mutations and derives the latest plan entities. Website creates/edits plans locally; extension derives contextual plan membership from the same synced definitions.

**Tech Stack:** TypeScript, Vitest, Next.js/React, Manifest V3, Phase 06 local mutation sync.

**Spec:** `docs/agentic/PLAN.md` Phase 11 and `docs/agentic/website/PLAN.md` W8.

## Constraints

- Plan definitions are user-owned local data; no backend.
- Generated queues are derived, not stored as authoritative state.
- Pin/defer overrides survive recalculation.
- Plan mutations converge deterministically and deletions use explicit tombstones.
- Same plan/catalog/progress inputs produce the same queue.

### Tasks

1. RED tests for adaptive buckets, pinned/deferred behavior and plan-mutation convergence.
2. Implement `@leet-progress/plans` plan model + derivation.
3. Add `PLAN_UPSERT`/`PLAN_DELETE` synchronization and provider actions.
4. Replace Plans placeholder with create/edit/delete + adaptive queue UI.
5. Add current plan context to extension side panel.
6. Full shared/web/extension verification.

**Exit gate:** Plan fixtures are deterministic, overrides survive recalculation, plan definitions sync locally, website and extension use shared plan output, and CI is green.
