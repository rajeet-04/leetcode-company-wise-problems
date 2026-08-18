# Leet Progress Agentic Program

This directory is the coordination layer for rebuilding the existing Leet Progress website and constructing the browser extension as one local-first product.

## Product rule

Leet Progress is one product with two first-class clients:

- `website/` — rework of the existing Next.js application hosted at `https://leet-progress-eta.vercel.app/`.
- `extension/` — new Manifest V3 browser extension for contextual LeetCode intelligence and automatic local progress capture.
- `local-sync/` — shared local-only synchronization, storage, backup, and conflict-resolution logic between the website and extension.
- `shared/` — catalog, scoring, recommendation, progress, analytics, and domain contracts used by both clients.

## Privacy rule

User data is local-only. Do not add a cloud user database, `chrome.storage.sync`, Supabase/Firebase user persistence, or server-side user profiles. Public catalog data may be fetched remotely because it contains no user data.

## Agent workflow

1. Read this file.
2. Read the root `AGENT.md`.
3. Read the relevant track `AGENT.md` and `PLAN.md`.
4. Read the specific phase plan before editing code.
5. Follow TDD: failing test, minimal implementation, passing test, verification.
6. Keep changes inside the active track unless the phase explicitly depends on a shared contract.
7. Commit after each independently testable task.
8. Do not skip verification or mark a phase complete without the stated exit gate.

## Program order

1. Shared foundation and Catalog V2.
2. Shared intelligence/progress contracts.
3. Website rework to consume shared contracts.
4. Extension vertical slice.
5. Local website-extension synchronization.
6. Automatic LeetCode progress capture.
7. Recommendations, topics, revision, interview plans, readiness, and personal analytics.
8. Catalog data update hardening, privacy, accessibility, performance, and cross-browser work.

## Key documents

- [`AGENT.md`](./AGENT.md) — global rules for agentic workers.
- [`PLAN.md`](./PLAN.md) — master phased roadmap and dependencies.
- [`shared/PLAN.md`](./shared/PLAN.md) — shared domain/data/intelligence work.
- [`website/PLAN.md`](./website/PLAN.md) — website rework roadmap.
- [`extension/PLAN.md`](./extension/PLAN.md) — extension construction roadmap.
- [`local-sync/PLAN.md`](./local-sync/PLAN.md) — local-only sync architecture and roadmap.
- [`execution/README.md`](./execution/README.md) — execution protocol and handoff rules.
