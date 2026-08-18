# Phase 05 — Extension Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Manifest V3 extension vertical slice that detects LeetCode problem routes, resolves the shared Catalog V2 snapshot, persists extension-local state, and renders contextual inline/popup/side-panel surfaces.

**Architecture:** A URL-only LeetCode adapter in the content script emits the current problem slug. The service worker owns packaged catalog lookup, shared priority calculation, and `chrome.storage.local`. Popup and side panel consume the same runtime message contract. No page localStorage, cloud user state, remote executable code, or broad host permissions.

**Tech Stack:** TypeScript, Bun bundler, Manifest V3, Chrome content scripts/service worker/side panel/storage, shared workspace packages, Vitest.

**Spec:** `docs/agentic/extension/PLAN.md` E1-E4 foundation and `docs/agentic/PLAN.md` Phase 5.

## Exit gate

- `extension/dist/manifest.json` is MV3 and host-scoped to LeetCode.
- `/problems/<slug>` detection is fixture-tested.
- Service worker resolves packaged Catalog V2 and shared priority.
- Current slug persists in `chrome.storage.local`; `chrome.storage.sync` is absent.
- Inline badge renders without depending on LeetCode DOM selectors.
- Popup and side panel consume runtime messages.
- `bun run test`, frontend typecheck/build, extension test/build all pass in PR CI.
