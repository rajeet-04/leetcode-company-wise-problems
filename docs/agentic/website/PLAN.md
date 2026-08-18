# Website Rework Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rework the existing Next.js website into the full planning, exploration, readiness, and personal-analytics client for Leet Progress while preserving local-only user data.

**Architecture:** The website consumes shared packages for all product logic, uses IndexedDB for personal state, and optionally synchronizes locally with the installed extension through the bridge defined in `local-sync/`.

**Tech Stack:** Next.js 16, React 19, Tailwind 4, TypeScript, Bun, IndexedDB, shared packages.

**Spec:** `docs/agentic/website/AGENT.md`, `docs/agentic/PLAN.md`.

## Global Constraints

- No cloud user persistence.
- Website works without extension installed.
- Do not duplicate shared business logic.
- Existing solved progress must migrate safely.
- Remove the legacy Console importer only after extension import is stable.

---

## Phase W1 — Safe migration foundation

- Introduce shared package imports without redesigning all screens at once.
- Add IndexedDB adapter implementing shared storage contracts.
- Migrate existing `leet-progress-solved` localStorage data idempotently.
- Add backup export before destructive migrations are possible.

**Exit gate:** Existing Explore behavior, solved toggles, build and typecheck remain functional; migrated solved count matches pre-migration data.

## Phase W2 — Application shell

Create primary destinations:

- `/` Today
- `/explore`
- `/companies`
- `/topics`
- `/plans`
- `/insights`
- `/problems/[slug]`
- `/companies/[company]`

**Exit gate:** All routes render through one navigation shell with responsive and keyboard-accessible navigation.

## Phase W3 — Explore V2

Support shared filters for title/topic/company/difficulty/window/progress/priority/trend/target overlap and ANY/ALL/threshold company modes.

Provide table, compact, and matrix-friendly representations without putting filter logic in components.

**Exit gate:** Filter fixture results match shared-core tests exactly.

## Phase W4 — Problem intelligence

Problem page includes:

- priority score + reasons;
- company observations and windows;
- target overlap;
- trends;
- topics;
- progress state;
- attempts/confidence/revision;
- related/recommended problems.

**Exit gate:** Page works with local-only state and produces the same score components as extension for the same fixture.

## Phase W5 — Company intelligence

Company page includes recent/core/cooling questions, topic/difficulty distributions, target status, weighted readiness, and next actions.

**Exit gate:** Company readiness is derived exclusively from shared calculations and local state.

## Phase W6 — Today + recommendations

Today route exposes adaptive sections:

- must solve;
- high priority;
- revision due;
- weak-area recovery;
- quick practice.

Allow manual defer/pin/complete actions without destroying recommendation history.

**Exit gate:** Queue recalculates after progress changes while preserving user overrides.

## Phase W7 — Topics + revision

Expose weighted topic readiness, weak areas, recommended progression, due revisions, confidence, and mastery status.

**Exit gate:** Topic readiness and revision counts match shared analytics fixtures.

## Phase W8 — Interview plans

Create/edit plan inputs: companies, interview date, workload preference, difficulty preference, optional excluded topics, and target priority.

Expose adaptive plan buckets and daily queue.

**Exit gate:** Plan changes recalculate deterministically and survive browser restart.

## Phase W9 — Insights

Local-only personal analytics:

- solve velocity;
- attempts;
- priority coverage;
- revision completion;
- target-company readiness;
- topic readiness;
- recommendation follow-through.

**Exit gate:** Insights function with network disabled after public catalog is available locally.

## Phase W10 — Extension bridge UX

Show extension connection state, last local exchange, pending mutations, and manual "Sync now" action without implying cloud sync.

**Exit gate:** Website remains fully usable without extension; when extension exists, local updates appear without page reload.

## Phase W11 — Backup, restore, legacy removal

Support versioned JSON export/import with merge/replace previews. After extension history import is production-verified, delete Console/bookmarklet instructions and connector-only UX.

**Exit gate:** Backup round-trip preserves all local user data and no normal onboarding path requires DevTools.
