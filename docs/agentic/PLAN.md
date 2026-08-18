# Leet Progress Master Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the website and construct the extension as two first-class clients of one shared local-first interview-intelligence platform.

**Architecture:** Shared packages own catalog normalization, intelligence, recommendations, progress, readiness, and analytics. The website and extension use client-specific storage adapters and synchronize user state peer-to-peer inside the browser through an extension bridge; no cloud user-data backend exists.

**Tech Stack:** TypeScript, Next.js 16, React 19, Tailwind 4, Bun, Manifest V3, IndexedDB, `chrome.storage.local`, GitHub Actions, static/public catalog delivery.

**Spec:** `docs/agentic/README.md` and approved product architecture in this program directory.

## Global Constraints

- User data is local-only.
- Public catalog data may be remote; personal data may not be uploaded by default.
- No `chrome.storage.sync`.
- No cloud database for progress, plans, notes, targets, revisions, or personal analytics.
- Website and extension consume shared contracts.
- Bookmarklet/console importer is legacy and removed only after extension import is proven stable.
- Every intelligence score must be explainable.
- TDD and independent verification are required for implementation tasks.

---

## Phase map

### Phase 0 — Repository and test foundation

**Outcome:** Monorepo/workspace structure and test commands support shared packages plus both clients without changing user-visible behavior.

**Exit gate:** Existing website builds and behaves as before; shared package test harness runs; CI verifies build/typecheck/tests.

### Phase 1 — Catalog V2

**Outcome:** Preserve company-window-frequency observations instead of collapsing useful source detail.

**Exit gate:** Catalog generation is deterministic, versioned, validated, and produces both full web and compact extension artifacts.

### Phase 2 — Shared domain core

**Outcome:** Extract filtering, company overlap, priority scoring contracts, trend calculation, progress state transitions, and storage interfaces from client code.

**Exit gate:** Shared unit tests cover deterministic behavior and website consumes the shared search/filter layer without regression.

### Phase 3 — Local progress model

**Outcome:** Replace solved-slug-only state with explicit unseen/attempted/solved/revision-due/mastered state plus attempts, confidence, timestamps, notes, and revision metadata.

**Exit gate:** Existing web local progress migrates without data loss and backup/restore tests pass.

### Phase 4 — Website rework foundation

**Outcome:** Convert current single-page experience into durable product navigation and shared-core consumption.

**Exit gate:** Today, Explore, Companies, Topics, Plans, and Insights routes exist with shared shell and no duplicated domain calculations.

### Phase 5 — Extension foundation

**Outcome:** Manifest V3 extension detects LeetCode problem routes, looks up shared catalog data, persists extension-local state, and renders one stable contextual surface.

**Exit gate:** Open a fixture/live problem -> slug detected -> intelligence lookup -> badge/panel renders -> local state persists.

### Phase 6 — Local synchronization

**Outcome:** Website IndexedDB and extension local store exchange mutations locally through the extension bridge on the Leet Progress origin.

**Exit gate:** Offline/local mutations made on either side merge bidirectionally without whole-state overwrite or cloud calls.

### Phase 7 — Automatic LeetCode progress capture

**Outcome:** LeetCode adapter emits normalized submission/account/problem events and updates local progress automatically.

**Exit gate:** Accepted, failed, SPA navigation, logged-out, and layout-fallback fixtures pass; website receives updates when open.

### Phase 8 — Intelligence experiences

**Outcome:** Company reach, target overlap, recency, trend, frequency, and personal relevance are exposed consistently across both clients.

**Exit gate:** Same problem/user state produces equivalent score components and explanation reasons in website and extension.

### Phase 9 — Recommendation engine

**Outcome:** Deterministic, explainable next-problem recommendations driven by target companies, weakness, revision need, progression, and priority.

**Exit gate:** Recommendation fixtures are stable and each recommendation includes machine-readable reasons.

### Phase 10 — Topic intelligence and revision

**Outcome:** Weighted topic readiness and revision scheduling replace raw solved counts.

**Exit gate:** Readiness and due-revision calculations are deterministic, migration-safe, and visible in both clients.

### Phase 11 — Interview plans

**Outcome:** Adaptive company-focused plans generate must-solve, high-priority, revision, weak-area, and optional queues.

**Exit gate:** Plan recalculates correctly after solve/fail/date/target changes without destroying user overrides.

### Phase 12 — Readiness and personal analytics

**Outcome:** Company readiness, topic readiness, study velocity, attempts, revision health, and recommendation follow-through are computed locally.

**Exit gate:** Personal analytics work with networking disabled and no user event is uploaded.

### Phase 13 — Catalog OTA data updates

**Outcome:** Extension can fetch validated public-data catalog updates without extension-store releases.

**Exit gate:** Bad schema/hash/update falls back to last known-good snapshot; no executable code is remotely loaded.

### Phase 14 — Privacy, accessibility, performance, resilience

**Outcome:** Narrow permissions, privacy copy, keyboard/a11y behavior, performance budgets, migration recovery, and LeetCode adapter fallback are verified.

**Exit gate:** Release checklist in each track passes.

### Phase 15 — Cross-browser and release

**Outcome:** Chromium release first; browser API adapters allow Firefox follow-up without changing core logic.

**Exit gate:** packaged builds and release docs exist; browser-specific differences remain isolated.

### Phase 16 — Legacy importer removal

**Outcome:** Console/bookmarklet workflow is deleted after extension onboarding/import is verified in production-like testing.

**Exit gate:** No user path requires DevTools; backup/import remains available.

## Dependency rules

- Phases 0-3 are prerequisites for broad feature expansion.
- Website and extension foundation work may proceed in parallel after shared contracts stabilize.
- Local sync requires both persistence adapters but does not require cloud infrastructure.
- Recommendations depend on intelligence + progress.
- Plans depend on recommendations + revision state.
- Readiness depends on progress/intelligence/revision, not on a server.

## Execution documents

Detailed task-level execution belongs under `docs/agentic/execution/` and track-specific phase files. Do not turn this master roadmap into a catch-all code checklist.
