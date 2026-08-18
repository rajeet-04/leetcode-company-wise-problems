# Phase 07 — Automatic LeetCode Progress Capture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Capture LeetCode submission outcomes automatically and convert them into local progress mutations without cloud user data or shared-core dependence on LeetCode internals.

**Architecture:** A packaged MAIN-world content script wraps LeetCode fetch/XHR responses only to observe likely submission-status responses and posts normalized status payloads to the isolated content script. A pure adapter classifies terminal outcomes and creates stable fingerprints. The service worker validates LeetCode sender origin and appends deterministic extension progress mutations, which Phase 06 sync then carries to the website locally.

**Tech Stack:** TypeScript, Manifest V3 content scripts, MAIN/ISOLATED worlds, fetch/XHR wrappers, Vitest, shared sync/progress packages.

**Spec:** `docs/agentic/extension/PLAN.md` Phase E6 and `docs/agentic/PLAN.md` Phase 7.

## Constraints

- No password/cookie extraction.
- No remote code.
- No direct business logic in DOM/network adapter.
- Only terminal submission results mutate progress.
- Same submission fingerprint is idempotent.
- Adapter failure never blocks LeetCode.
- Website update occurs through existing local sync, not a server.

### Tasks

1. RED tests for response classification/fingerprinting and deterministic mutation creation.
2. Pure submission adapter implementation.
3. Packaged MAIN-world fetch/XHR observer scoped to likely submission/check responses.
4. Isolated content relay with exact `https://leetcode.com` origin check and current problem slug.
5. Service-worker mutation append with LeetCode sender validation.
6. Full shared/web/extension verification.

**Exit gate:** Accepted/failure/non-terminal fixtures pass; repeated identical submission delivery produces one logical mutation; extension build includes packaged main-world hook; website/shared builds remain green.
