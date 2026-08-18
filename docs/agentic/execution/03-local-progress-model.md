# Phase 03 — Local Progress Model Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans or superpowers:subagent-driven-development. Follow TDD and checkpoint every migration/storage change.

**Goal:** Replace solved-slug-only web state with canonical local progress while preserving every existing solved slug and providing versioned backup/restore.

**Architecture:** `@leet-progress/progress` owns schema/migration/serialization. The website gets an IndexedDB-backed `ProgressStore` adapter with localStorage fallback only for migration. No user state leaves the browser.

**Tech Stack:** TypeScript, IndexedDB, React 19, Vitest, Bun.

**Spec:** `docs/agentic/PLAN.md` Phase 3, `docs/agentic/shared/PLAN.md` S4, `docs/agentic/website/PLAN.md` W1.

## Global Constraints
- No cloud persistence or `chrome.storage.sync`.
- Migration from `leet-progress-solved` is idempotent and non-destructive.
- Existing solved toggles continue to work.
- Backup JSON is versioned and validated before merge/replace.
- The website remains usable when IndexedDB is unavailable by surfacing a local-storage-only fallback, never a cloud fallback.

## Tasks
1. Add progress schema version, migration from solved slug arrays/sets, serialization and backup types/tests.
2. Add `IndexedDbProgressStore` and preference store under `frontend/src/local/` with fake/in-memory contract tests where browser IndexedDB is unavailable.
3. Add a web progress provider/hook that loads IndexedDB, migrates `leet-progress-solved` once, and exposes solved slug compatibility.
4. Replace direct localStorage reads/writes in `frontend/app/page.tsx` with the progress provider while preserving current UI.
5. Add backup export/import helpers with merge/replace preview and round-trip tests; UI surface can remain minimal in this phase.
6. Verify migration idempotence, solved count preservation, shared tests, Next route types, typecheck and production build.

## Exit gate
- Existing solved slugs survive first load and repeated migration.
- Toggle writes canonical progress state.
- Backup round-trip preserves progress/preferences.
- Website passes build/typecheck with no direct solved-state persistence remaining in `page.tsx`.
