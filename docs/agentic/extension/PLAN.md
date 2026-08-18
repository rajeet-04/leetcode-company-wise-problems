# Extension Construction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Manifest V3 extension that augments LeetCode with full Leet Progress intelligence, captures progress locally, and synchronizes locally with the website.

**Architecture:** Content scripts detect LeetCode context through an isolated adapter; a service worker coordinates browser storage, catalog updates, and messaging; UI surfaces consume shared domain packages. User data remains in extension-local storage and synchronizes peer-to-peer with the website bridge.

**Tech Stack:** TypeScript, React, Manifest V3, `chrome.storage.local`, service worker, content scripts, side panel/popup, shared packages.

**Spec:** `docs/agentic/extension/AGENT.md`, `docs/agentic/PLAN.md`, `docs/agentic/local-sync/PLAN.md`.

## Global Constraints

- No cloud user persistence.
- No `chrome.storage.sync`.
- No remote executable code.
- LeetCode selectors stay isolated in the adapter.
- Shared scoring/progress/recommendation logic is imported, not rewritten.
- Extension should be non-blocking and preserve normal LeetCode operation if Leet Progress fails.

---

## Phase E1 — Manifest and runtime shell

Create extension package, Manifest V3 config, service worker, content-script registration, popup/options shell, side-panel capability where supported, browser API adapter, and build/package commands.

**Exit gate:** Unpacked extension loads without errors and activates only on configured LeetCode and Leet Progress origins.

## Phase E2 — Problem detection vertical slice

Detect LeetCode SPA navigation and current problem slug. Resolve slug against compact shared catalog. Render a minimal priority/company badge.

**Exit gate:** Fixture and live-smoke navigation between two problem pages updates badge without full browser reload.

## Phase E3 — Problem intelligence panel

Expose priority + reasons, company windows, target overlap, trend, topics, progress state, revision state and recommended next actions.

**Exit gate:** Same fixture produces score components equivalent to website/shared-core output.

## Phase E4 — Local storage adapter

Implement shared storage contracts over extension-local persistence. Persist targets, progress, attempts, notes metadata, plans, revisions, preferences, event log and catalog metadata.

**Exit gate:** Restarting extension/browser preserves state and migration tests pass.

## Phase E5 — Solved-history import

Replace DevTools workflow with an extension-owned import flow using the user's active LeetCode context where technically viable. Normalize imported identifiers into shared progress mutations.

**Exit gate:** Import is idempotent, never requests/reads passwords, and duplicate imports do not inflate attempts/events.

## Phase E6 — Submission capture

LeetCode adapter observes normalized outcomes and emits `SubmissionAccepted`/`SubmissionFailed`. Progress engine records attempts and status transitions.

**Exit gate:** Accepted/wrong-answer/runtime-error fixtures pass; adapter failure does not crash extension UI.

## Phase E7 — Side panel and popup

Side panel provides full contextual client: current problem, companies, recommendations, queue, plan, topic/readiness snapshots, notes/confidence and revision. Popup provides global status, Today queue, sync state and preferences.

**Exit gate:** Core capabilities remain accessible even where side panel support is absent via overlay/popup fallback.

## Phase E8 — Local website bridge endpoint

Implement the extension side of the protocol defined by `local-sync/`. Validate origin, protocol/schema versions, message size, mutation IDs and responses.

**Exit gate:** Only approved Leet Progress origin can initiate bridge exchange; no arbitrary webpage can read extension user state.

## Phase E9 — Public catalog updates

Ship last-known-good compact snapshot. Periodically check public catalog metadata, download data-only update, validate schema/checksum, atomically promote or retain previous snapshot.

**Exit gate:** Corrupt update test leaves active catalog unchanged; no downloaded JavaScript is executed.

## Phase E10 — Recommendations, plans, revision and analytics surfaces

Expose all shared capabilities contextually, with compact extension-first presentation rather than duplicating website dashboards pixel-for-pixel.

**Exit gate:** Capability parity checklist passes for intelligence, targets, recommendations, topics, plans, revision, readiness and personal analytics.

## Phase E11 — Hardening and release

Verify permissions, CSP, accessibility, keyboard use, SPA resilience, memory/performance, storage growth, backup recovery, privacy copy, package generation, Chrome/Edge/Brave smoke tests.

**Exit gate:** Release checklist passes with no cloud user-data dependency.

## Phase E12 — Firefox adaptation

Implement browser-specific adapters/manifest differences without changing shared domain logic.

**Exit gate:** Firefox package passes equivalent fixture and local-storage tests; unsupported Chromium-only UI features have defined fallbacks.
