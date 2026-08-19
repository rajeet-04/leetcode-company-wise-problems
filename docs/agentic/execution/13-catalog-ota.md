# Phase 13 — Public Catalog OTA Data Updates Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow the extension to refresh public Catalog V2 data without an extension-store release while keeping executable code packaged and user data local-only.

**Architecture:** Catalog generation publishes canonical `catalog.json` + metadata under `frontend/public/catalog/`. The extension ships a packaged fallback, periodically checks the public metadata with `chrome.alarms`, validates schema + SHA-256 before promotion, and stores a validated public-data snapshot in extension IndexedDB. The service worker always falls back to the packaged snapshot if cache/network/validation fails.

**Tech Stack:** TypeScript, Catalog V2 builder, Web Crypto, Manifest V3 alarms/service worker, IndexedDB, Vitest.

**Spec:** `docs/agentic/PLAN.md` Phase 13 and `docs/agentic/extension/PLAN.md` E9.

## Constraints

- Remote payload is JSON public catalog data only; no remote JS/WASM/executable code.
- Personal progress/targets/plans/notes/analytics are never sent with catalog requests.
- Wrong schema, invalid JSON or checksum mismatch must never replace the active snapshot.
- Packaged catalog remains a permanent fallback.
- Alarm is recreated when service worker starts.

### Tasks

1. RED tests for metadata/schema/checksum validation.
2. Publish canonical catalog + metadata under website public assets.
3. Implement browser-safe remote catalog validator.
4. Add extension IndexedDB public-catalog cache.
5. Add periodic alarm refresh and service-worker fallback/promotion.
6. Update upstream catalog workflow to commit public artifacts.
7. Full shared/web/extension verification.

**Exit gate:** corrupt update leaves active catalog unchanged, valid update becomes active, packaged fallback always works, and no executable/user-data remote path exists.
