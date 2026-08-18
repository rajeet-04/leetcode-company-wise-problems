# Shared Core Agent Guide

## Scope

This track owns reusable product logic consumed by both website and extension.

### Owns

- canonical problem/catalog types;
- catalog builder and validators;
- search/filter/overlap logic;
- deterministic scoring and trend calculations;
- progress state machine;
- recommendation contracts and ranking inputs;
- readiness/personal-analytics calculations;
- storage interfaces and serialization schemas.

### Does not own

- Next.js route/layout presentation;
- LeetCode DOM scraping;
- Chrome/Firefox APIs;
- website-extension transport implementation;
- server-side user persistence.

## Rules

- All logic must be deterministic and unit-testable without DOM/browser globals.
- Every schema has an explicit version.
- Every score returns reasons/components in addition to the final number/tier.
- Catalog transformation must be reproducible from source CSVs.
- Keep remote/public catalog state separate from personal/local user state.
- Avoid runtime dependencies that prevent reuse in browser extension contexts.

## Verification

Before declaring a shared-core task complete, run the smallest targeted tests, then the shared test suite, typecheck, and catalog validation commands defined by the active implementation phase.
