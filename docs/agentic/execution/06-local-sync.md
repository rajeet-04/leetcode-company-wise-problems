# Phase 06 — Local Website ↔ Extension Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Synchronize personal progress between the website and extension inside the same browser profile without any cloud user-data service.

**Architecture:** `@leet-progress/sync` owns immutable versioned mutations, deterministic merge/application, handshake and exchange contracts. The website stores progress + mutation log in IndexedDB (localStorage fallback); the extension stores equivalent records in `chrome.storage.local`. A content script restricted to `https://leet-progress-eta.vercel.app/*` bridges `window.postMessage` to the extension service worker. Normal synchronization exchanges missing mutations only.

**Tech Stack:** TypeScript, Vitest, IndexedDB, `chrome.storage.local`, Chrome runtime messaging, `window.postMessage`.

**Spec:** `docs/agentic/local-sync/PLAN.md`, `docs/agentic/PLAN.md` Phase 6.

## Global Constraints

- No backend user-data API.
- No `chrome.storage.sync`.
- No whole-state last-write-wins normal sync.
- Exact website origin allowlist: `https://leet-progress-eta.vercel.app` for the current deployment.
- Protocol/schema versions are validated on both sides.
- Duplicate mutation delivery is a no-op.
- Existing Phase 03 progress remains usable when extension is absent.

### Task 1 — Shared mutation protocol

Create `packages/sync` with `MutationEnvelope`, mutation validation, deterministic merge, progress application, handshake/exchange types and tests for duplicate/order convergence.

### Task 2 — Website replica

Upgrade local store with mutation/meta persistence; bootstrap existing Phase 03 records as per-problem mutations; change provider actions to append mutations and apply remote batches.

### Task 3 — Extension replica

Persist progress/mutation log/installation ID in `chrome.storage.local`; use the same shared merge/application logic.

### Task 4 — Origin-restricted bridge

Add a website-only content script that forwards namespaced page messages to the service worker. Service worker rejects sync messages unless sender origin exactly matches the configured Leet Progress origin.

### Task 5 — Live local exchange

Website bridge sends known mutation IDs + local mutations after provider readiness and after local changes. Extension returns only missing mutations; website applies them without reload.

### Task 6 — Verification

Run shared tests, Catalog V2 validation, frontend typecheck/build, extension tests/build. Search source to confirm no `chrome.storage.sync`, progress API endpoint, Supabase/Firebase user persistence, or personal-data fetch path was introduced.

**Exit gate:** Two replicas starting with disjoint problem mutations converge to equivalent progress; duplicate/interrupted-style repeated exchange is idempotent; exact-origin bridge restriction is testable; both clients remain independently usable.
