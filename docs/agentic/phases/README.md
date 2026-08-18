# Phase Navigation

This folder provides phase-level navigation without duplicating the detailed execution documents.

## Foundation

- Phase 00 — Repository and test foundation: `../execution/00-foundation.md`
- Phase 01 — Catalog V2: `../execution/01-catalog-v2.md`

## Shared platform

- Phase 02 — Shared domain core: `../shared/PLAN.md` Phase S3/S4
- Phase 03 — Local progress model: `../shared/PLAN.md` Phase S4

## Website rework

- Phases W1-W11: `../website/PLAN.md`

## Extension construction

- Phases E1-E12: `../extension/PLAN.md`

## Local synchronization

- Phases L1-L10: `../local-sync/PLAN.md`

## Later product capabilities

Recommendations, topic intelligence, revision, interview plans, readiness, personal analytics, public catalog OTA updates, hardening, cross-browser support, and legacy importer removal are sequenced in `../PLAN.md` and owned by the track plans above.

## Rule for adding a new execution phase

A new execution document belongs under `../execution/` only when:

1. its input contracts are stable;
2. it produces independently testable software;
3. exact files/interfaces/tests can be named;
4. it has an objective exit gate;
5. it does not silently change product/privacy architecture.

Do not create one giant execution file for all remaining phases. Split at independently reviewable subsystem boundaries.
