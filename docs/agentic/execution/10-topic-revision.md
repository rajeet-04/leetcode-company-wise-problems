# Phase 10 — Topic Intelligence and Revision Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace raw topic solved counts with weighted topic readiness and add deterministic local revision scheduling/completion shared by website and extension.

**Architecture:** `@leet-progress/intelligence` calculates topic readiness from Catalog V2 priority + local progress. `@leet-progress/progress` owns revision spacing/date calculations. `@leet-progress/sync` carries `REVISION_COMPLETED` mutations so website and extension converge. Clients render shared outputs only.

**Tech Stack:** TypeScript, Vitest, Next.js/React, Manifest V3, local mutation sync.

**Spec:** `docs/agentic/PLAN.md` Phase 10 and `docs/agentic/website/PLAN.md` W7.

## Constraints

- Topic readiness is weighted by problem value, not raw solved count alone.
- Revision scheduling is deterministic for the same progress/confidence/priority/time.
- Revision completion increments revisit count and schedules the next review without cloud state.
- Shared domain code has no browser/network dependencies.

### Tasks

1. RED tests for topic readiness and revision schedule.
2. Implement shared readiness + revision spacing.
3. Add `REVISION_COMPLETED` sync mutation and reducer behavior.
4. Rework Topics route to show local readiness and due revisions with complete action.
5. Expose revision readiness in extension current-problem panel.
6. Full shared/web/extension gate.

**Exit gate:** Topic/readiness fixtures are deterministic, revision completion converges across replicas, Topics displays shared metrics, extension shows revision state, and full CI passes.
