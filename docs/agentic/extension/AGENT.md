# Extension Construction Agent Guide

## Scope

Build a new browser extension as the execution/context client of Leet Progress on LeetCode.

## Responsibilities

- Manifest V3 shell and narrow permissions;
- LeetCode route/problem/submission/account adapter;
- inline badge, overlay, side panel, popup/options experiences;
- extension-local persistence through shared storage contracts;
- local sync endpoint for the Leet Progress website bridge;
- solved-history import and automatic progress capture;
- public catalog snapshot/update consumption;
- browser API abstraction for later Firefox support.

## Non-goals

- No cloud user profile or progress service.
- No `chrome.storage.sync`.
- No remote executable-code loading.
- No direct LeetCode selectors outside the adapter layer.
- No duplicate scoring/recommendation/readiness implementation.

## UX role

The extension is the execution environment. It should answer "why this problem matters", "how it maps to my targets", and "what next" without obstructing LeetCode.

## LeetCode isolation rule

All LeetCode-specific parsing/detection lives behind an adapter that emits normalized events such as:

```ts
type LeetCodeEvent =
  | { type: "ProblemOpened"; slug: string }
  | { type: "SubmissionAccepted"; slug: string; observedAt: string }
  | { type: "SubmissionFailed"; slug: string; outcome: string; observedAt: string }
  | { type: "AccountDetected"; accountKey: string | null }
  | { type: "RouteChanged"; url: string };
```

No scoring/progress component should query LeetCode DOM directly.

## Permission rule

Request only the minimum capabilities necessary for the current release. Broad arbitrary-site access is forbidden.
