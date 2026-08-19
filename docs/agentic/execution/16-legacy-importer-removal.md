# Phase 16 — Extension History Import and Legacy Importer Removal

> **Execution mode:** inline, using Superpowers TDD and verification gates.

**Goal:** Replace the DevTools/console LeetCode solved-history importer with an explicit extension-native import on LeetCode Progress, then remove the legacy connector without losing backup/import recovery.

**Architecture:** A Progress-page extension content script presents an explicit import action. On click it injects a packaged, web-accessible page-context adapter that queries the signed-in LeetCode progress endpoint using the existing LeetCode session, emits only solved slugs, and immediately removes itself. The isolated extension validates the result and sends solved slugs to the service worker, which appends deterministic idempotent local `PROBLEM_SOLVED` mutations in bulk. No passwords, cookies, solution code, or user data are sent to Leet Progress servers.

**Tech Stack:** TypeScript, Manifest V3/WebExtensions content scripts, existing local mutation protocol, Vitest, Bun, Next.js.

**Spec:** `docs/agentic/PLAN.md` Phase 16.

## Constraints

- No DevTools or pasted JavaScript in any supported user path.
- Import is user-initiated on `https://leetcode.com/progress/`.
- Import stores solved slugs locally only; no cloud user-data path is introduced.
- History mutations are deterministic and idempotent across repeated imports.
- Existing local backup/restore remains available.
- Legacy `leetcode-connector.js` and console-oriented UI are removed only after the extension path passes tests and both browser builds.

## Tasks

1. RED tests for history-result validation and deterministic idempotent solved mutations.
2. Add packaged LeetCode Progress page-context history adapter and isolated import UI.
3. Add service-worker history-import message and bulk local mutation persistence.
4. Add Progress-page content-script registration and cross-browser web-accessible resource handling.
5. Replace website console import UX with extension-native guidance; preserve local backup/restore.
6. Delete legacy connector/console launcher files and references.
7. Run shared/privacy/catalog/web/extension tests plus Chromium and Firefox builds.
8. Final review gate, then merge.

**Exit gate:** a signed-in Progress-page fixture/result imports solved slugs idempotently without DevTools, all legacy console-launcher references are gone, backup/restore remains, and the full permanent CI gate is green.
