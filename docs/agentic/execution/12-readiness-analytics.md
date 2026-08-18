# Phase 12 — Readiness and Personal Analytics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Compute explainable company readiness and personal study analytics entirely from local progress + public Catalog V2 data, then expose them on website Insights and extension context.

**Architecture:** `@leet-progress/analytics` owns pure calculations only. Company readiness combines high-priority coverage, topic coverage, difficulty coverage and revision health. Personal analytics derives solve velocity, attempt burden, revision counts and target-company readiness. Clients only render returned components; no analytics payload is uploaded.

**Tech Stack:** TypeScript, Vitest, shared intelligence/progress/catalog types, Next.js/React, Manifest V3.

**Spec:** `docs/agentic/shared/PLAN.md` S6 and `docs/agentic/PLAN.md` Phase 12.

## Constraints

- No network or browser globals in analytics package.
- Readiness is explainable through component scores.
- Same catalog/progress/time inputs produce identical outputs.
- Empty progress and no-target cases return valid zero-state results, never NaN.
- Personal analytics stays local; no telemetry backend is introduced.

### Tasks

1. RED tests for company readiness, empty state, solve velocity and attempt burden.
2. Implement shared readiness/personal analytics.
3. Replace Insights placeholder with local dashboards and target readiness cards.
4. Add condensed readiness to extension side panel.
5. Full shared/web/extension verification and privacy grep.

**Exit gate:** Analytics fixtures are deterministic/explainable, website and extension consume shared results, and CI passes with no user-data network path.
