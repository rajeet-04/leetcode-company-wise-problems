# Phase 15 — Cross-Browser Packaging and Release Plan

> **Execution mode:** inline, using Superpowers TDD and verification gates.

**Goal:** Produce verified Chromium and Firefox packages from one extension codebase while keeping browser-specific manifest/runtime differences isolated.

**Architecture:** Chromium keeps Manifest V3 `background.service_worker` + `side_panel`. Firefox receives a generated manifest using `background.scripts` + `sidebar_action` and a packaged page-world hook loader where needed. Shared application/domain code remains unchanged. Runtime calls that differ by browser are feature-detected behind a small browser adapter.

**Constraints**

- No forked business logic.
- No new host permissions.
- Firefox build must preserve local-only storage/sync behavior.
- No remote executable code.
- Chromium remains the primary release target.
- Both packages must be reproducible by CI.

## Tasks

1. RED test for deterministic Firefox manifest transformation.
2. Implement manifest transformation and browser runtime adapter.
3. Add Firefox page-world hook loader and web-accessible packaged hook.
4. Generalize extension build script for Chromium/Firefox outputs.
5. Add `build:chromium`, `build:firefox`, `build:all` and release documentation.
6. Extend permanent PR CI to build both packages.
7. Run full shared/privacy/catalog/web/extension tests and both builds.

**Exit gate:** Chromium and Firefox packages build from the same source, browser-specific differences remain isolated, privacy/permission invariants remain unchanged, and the full CI gate is green.
