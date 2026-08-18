# Phase 14 — Privacy, Accessibility, Performance and Resilience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harden the local-first product before release: enforce privacy/permission invariants, expose local sync diagnostics, improve accessibility, reduce extension polling, and add repeatable release audits.

**Architecture:** Privacy checks are automated in repository CI. Sync diagnostics remain derived from local bridge timestamps/errors. Extension side-panel refresh becomes event-driven from `chrome.storage.onChanged`. Website exposes a privacy page and visible local-sync state without introducing any networked user-data service.

**Tech Stack:** TypeScript, Vitest, Node/Bun audit script, Next.js/React, Manifest V3.

## Constraints

- No `chrome.storage.sync`, cloud user DB, personal progress API, or hidden telemetry.
- Extension permissions stay limited to `storage`, `sidePanel`, `alarms` and the two required host origins.
- Sync diagnostics must not expose note bodies or mutation payload contents.
- Keyboard/focus semantics remain usable.
- Polling should not be used when browser storage change events are available.

### Tasks

1. RED tests for sync diagnostic classification and no side-panel interval polling.
2. Add privacy/release audit script and permanent PR CI gate.
3. Implement local sync diagnostics provider + manual sync action.
4. Surface sync state in website shell/Insights and add privacy page.
5. Replace side-panel polling with storage change events.
6. Add manifest permission/privacy regression tests and extension catalog size budget.
7. Full shared/web/extension verification.

**Exit gate:** privacy audit, manifest audit, shared/web/extension CI, accessibility-oriented build checks and performance budget pass; no user-data cloud path exists.
