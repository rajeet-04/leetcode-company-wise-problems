# Implementation Workspace Guide

This folder is the durable implementation-status layer for agentic work. It is intentionally separate from architecture plans and detailed execution phase documents.

## Purpose

Use this area to record what has actually been implemented, verified, migrated, and released. Do not use it to invent new scope; planning changes belong in the relevant `PLAN.md` first.

## Track status files

During implementation, maintain:

- `implementation/shared-status.md`
- `implementation/website-status.md`
- `implementation/extension-status.md`
- `implementation/local-sync-status.md`

Each status file should contain only verified facts from completed work:

```md
# Track Status

## Current phase
Phase X — Name

## Completed
- commit SHA — tested deliverable

## Verification
- `command` — PASS/FAIL and date

## Migrations
- schema version changes actually shipped

## Open risks
- concrete unresolved risk

## Next executable phase
- exact execution document path
```

Create a status file when implementation of that track begins; do not pre-fill fake completion state.

## Source-of-truth hierarchy

1. Global product constraints: `docs/agentic/AGENT.md`
2. Master sequencing: `docs/agentic/PLAN.md`
3. Track constraints: `<track>/AGENT.md`
4. Track roadmap: `<track>/PLAN.md`
5. Exact task execution: `docs/agentic/execution/*.md`
6. Verified implementation state: `docs/agentic/implementation/*-status.md`

When documents disagree, stop implementation and reconcile the higher-level contract before continuing.
