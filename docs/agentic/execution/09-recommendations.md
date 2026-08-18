# Phase 09 — Recommendation Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce deterministic, explainable next-problem recommendations from shared catalog intelligence and local progress, then expose the same ranked results on website Today and the extension side panel.

**Architecture:** `@leet-progress/recommendations` is a pure browser-safe package. It consumes Catalog V2, local progress, synchronized targets and optional weak-topic/current-problem/plan context. It uses `@leet-progress/intelligence` for priority rather than reimplementing scoring. Clients render returned ranking and reason codes only.

**Tech Stack:** TypeScript, Vitest, React/Next.js, Manifest V3 shared packages.

**Spec:** `docs/agentic/shared/PLAN.md` S5 and `docs/agentic/PLAN.md` Phase 9.

## Constraints

- No recommendation without at least one machine-readable reason.
- Stable input produces stable order.
- Solved problems are excluded unless revision is due.
- Tie breaking is deterministic.
- Shared engine has no DOM, storage, network, or client imports.

### Tasks

1. RED fixture tests for ranking, solved exclusion, revision inclusion and reasons.
2. Implement shared candidate generation/ranking.
3. Replace Today placeholder with local recommendation queue.
4. Include contextual recommendations in extension problem payload/side panel.
5. Run full shared/web/extension gate.

**Exit gate:** Fixture rankings are stable, reasons are non-empty, website and extension consume the shared engine, and all CI gates pass.
