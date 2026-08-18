# Phase 08 — Intelligence Experiences Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expose identical explainable problem/company intelligence and synchronized target companies across website and extension.

**Architecture:** `@leet-progress/intelligence` produces one `ProblemIntelligence` object from Catalog V2 + local progress + target companies. `@leet-progress/sync` gains a versioned `TARGETS_SET` mutation and deterministic target derivation. Website and extension render the same score components/reasons; target edits originate as local mutations and converge through Phase 06.

**Tech Stack:** TypeScript, React, Next.js, Manifest V3, existing local sync and Catalog V2.

**Spec:** `docs/agentic/PLAN.md` Phase 8, `docs/agentic/website/PLAN.md` W4-W5 foundation, `docs/agentic/extension/PLAN.md` E3.

## Exit gate

- Shared intelligence fixture is deterministic.
- Target-company mutations converge and extension scoring uses synchronized targets.
- Website problem page renders priority, overlap, recency, trend, frequency, reasons, windows and local progress.
- Company screen allows local target selection.
- Extension badge/side panel render the same shared intelligence components.
- Full shared/web/extension CI passes.
