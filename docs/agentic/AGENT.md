# Global Agent Contract

## Mission

Build Leet Progress as one privacy-first interview-preparation product with two first-class clients: the existing website and a new browser extension.

## Non-negotiable constraints

- User data stays local to the browser/device.
- Never add cloud user persistence, `chrome.storage.sync`, Supabase/Firebase user profiles, or a server-side progress database.
- Public catalog data may be remotely hosted and updated.
- Website and extension must share domain logic instead of reimplementing scoring, filtering, recommendations, progress, readiness, or analytics independently.
- Bookmarklet/DevTools-paste import is legacy only and must be removed after extension import is stable.
- Extension permissions must be narrowly scoped to LeetCode, the Leet Progress website, extension storage, and capabilities explicitly required by a phase.
- Any score shown to a user must expose its contributing reasons; do not create opaque magic numbers.
- Do not introduce ML ranking until event data exists to justify it. Start with versioned deterministic heuristics.

## Engineering method

Use test-driven development for feature and bugfix work:

1. Write a failing test that describes the behavior.
2. Run the smallest relevant test command and confirm the expected failure.
3. Implement the minimum production change.
4. Run the targeted test and confirm it passes.
5. Run the track verification suite.
6. Commit an independently testable change.

Do not combine unrelated refactors with feature work.

## Isolation

Prefer an isolated git worktree for implementation. Documentation-only planning may remain on a docs branch. Agents executing a phase should read the phase's `PLAN.md`, track `AGENT.md`, and this file before editing code.

## Shared ownership boundaries

- `shared/` owns domain types, catalog model, deterministic intelligence, recommendation contracts, progress state transitions, personal analytics calculations, and storage interfaces.
- `website/` owns web routing, web UX, IndexedDB adapter, dashboard presentation, planning surfaces, and bridge UI.
- `extension/` owns Manifest V3, content scripts, LeetCode adapter, extension UI, browser storage adapter, and browser messaging endpoints.
- `local-sync/` owns mutation/event protocol, merge rules, website-extension bridge, backup/import/export, schema migration, and conflict handling.

No track may bypass these boundaries merely for convenience.

## Definition of done for a task

A task is complete only when:

- implementation matches the approved interfaces;
- targeted tests pass;
- track-level typecheck/lint/build commands pass where applicable;
- migration/backward compatibility behavior is covered when state shape changes;
- privacy requirements are unchanged or strengthened;
- docs are updated when public interfaces or workflow assumptions change;
- the commit is scoped to one testable unit.

## Forbidden shortcuts

- No copying scoring logic into both clients.
- No whole-state last-write-wins synchronization blobs.
- No direct LeetCode DOM selectors outside the LeetCode adapter layer.
- No remote executable-code updates for the extension.
- No silent analytics upload of personal solving data.
- No deleting legacy progress until migration/backup is verified.
- No claiming a phase is complete without running its exit-gate commands.
