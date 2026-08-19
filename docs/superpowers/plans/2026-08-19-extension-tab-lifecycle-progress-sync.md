# Extension Tab Lifecycle and Progress Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Leet Progress a LeetCode-scoped companion with reliable Chromium panel opening, per-tab side-panel lifecycle, an expanded/minimized launcher, and automatic idempotent solved-history reconciliation.

**Architecture:** Keep shared product logic unchanged. Add three extension-local pure modules (`panel-lifecycle`, `launcher-state`, `history-reconcile`) and route browser-specific behavior through `browser-runtime.ts`; the service worker owns tab panel configuration and reconciliation metadata, while content scripts own only page-session UI state and page-context requests.

**Tech Stack:** TypeScript, Manifest V3 Chromium WebExtensions, Firefox WebExtensions fallback, Vitest, Bun.

**Spec:** `docs/superpowers/specs/2026-08-19-extension-tab-lifecycle-progress-sync-design.md`

## Global Constraints

- User progress remains local-only; no cloud user-data API, telemetry upload, or `chrome.storage.sync`.
- Host permissions remain exactly `https://leetcode.com/*` and `https://leet-progress-eta.vercel.app/*`.
- Do not add the broad `tabs` permission.
- Do not open or navigate hidden/background LeetCode tabs for reconciliation.
- Historical reconciliation guarantees solved status only; do not invent historical attempt counts/timestamps.
- Existing live submission capture, OTA public catalog refresh, recommendations, plans, analytics, website sync, dark mode, and Firefox packaging must continue to work.
- RED/GREEN commits may remain detached; push only one consolidated feature head to conserve Vercel deployments.

---

## File Structure

### New focused modules

- `extension/src/panel-lifecycle.ts` — pure URL → per-tab side-panel configuration decisions.
- `extension/src/panel-lifecycle.test.ts` — tab-scoping and LeetCode URL tests.
- `extension/src/launcher-state.ts` — pure expanded/minimized state machine.
- `extension/src/launcher-state.test.ts` — transition tests.
- `extension/src/history-reconcile.ts` — reconciliation metadata parsing/state transitions.
- `extension/src/history-reconcile.test.ts` — pending/success/failure state tests.

### Existing files modified

- `extension/src/browser-runtime.ts` — add immediate Chromium panel configuration helpers; preserve Firefox sidebar fallback.
- `extension/src/chrome-api.d.ts` — type `sidePanel.setOptions`, runtime startup, and tab events used by implementation.
- `extension/src/messages.ts` — make panel-open and history-status messages explicit/exhaustive.
- `extension/src/service-worker.ts` — immediate panel-open message path, tab-scoped lifecycle hooks, reconciliation metadata updates.
- `extension/src/content.ts` — render launcher from state machine, minimize after successful panel open, preserve mode across SPA navigation.
- `extension/content.css` — compact minimized launcher + minimize affordance + focus/dark states.
- `extension/src/progress-import.ts` — automatic Progress-page reconciliation + compact status/retry surface.
- `extension/src/history-import.ts` — reuse deterministic mutation generation and expose result-count helpers if needed.
- `extension/manifest.json` — keep side-panel path and existing permissions/content-script scopes; no broader host scope.
- `extension/src/manifest-transform.ts` — preserve Firefox sidebar packaging semantics if Chromium lifecycle typings require transform changes.

---

### Task 1: Tab-Scoped Panel Lifecycle Contract

**Files:**
- Create: `extension/src/panel-lifecycle.ts`
- Create: `extension/src/panel-lifecycle.test.ts`
- Modify: `extension/src/browser-runtime.ts`
- Modify: `extension/src/chrome-api.d.ts`

**Interfaces:**
- Produces: `panelOptionsForUrl(url: string | undefined): { enabled: boolean; path?: "sidepanel.html" }`
- Produces: `configureExtensionPanel(tabId: number, url: string | undefined): Promise<void>`
- Existing `openExtensionPanel(tabId)` remains the user-gesture open primitive.

- [ ] **Step 1: Write failing lifecycle tests**

```ts
import { describe, expect, it } from "vitest";
import { panelOptionsForUrl } from "./panel-lifecycle";

describe("panelOptionsForUrl", () => {
  it("enables the side panel for LeetCode", () => {
    expect(panelOptionsForUrl("https://leetcode.com/problems/two-sum/"))
      .toEqual({ enabled: true, path: "sidepanel.html" });
  });

  it("disables the side panel outside LeetCode", () => {
    expect(panelOptionsForUrl("https://github.com/rajeet-04"))
      .toEqual({ enabled: false });
  });

  it("disables unknown URLs", () => {
    expect(panelOptionsForUrl(undefined)).toEqual({ enabled: false });
  });
});
```

- [ ] **Step 2: Verify RED**

Run: `cd extension && bun run test -- panel-lifecycle.test.ts`
Expected: FAIL because `panel-lifecycle.ts` does not exist.

- [ ] **Step 3: Implement pure lifecycle decision**

```ts
export type PanelOptions = { enabled: boolean; path?: "sidepanel.html" };

export function panelOptionsForUrl(url: string | undefined): PanelOptions {
  if (!url) return { enabled: false };
  try {
    return new URL(url).origin === "https://leetcode.com"
      ? { enabled: true, path: "sidepanel.html" }
      : { enabled: false };
  } catch {
    return { enabled: false };
  }
}
```

- [ ] **Step 4: Add runtime adapter**

`configureExtensionPanel(tabId, url)` calls `chrome.sidePanel.setOptions({ tabId, ...panelOptionsForUrl(url) })` when Chromium sidePanel exists. Firefox has no-op tab configuration; `openExtensionPanel` continues to call `sidebarAction.open()` when sidePanel is unavailable.

- [ ] **Step 5: Verify GREEN**

Run: `cd extension && bun run test -- panel-lifecycle.test.ts`
Expected: PASS.

---

### Task 2: Reliable Immediate Panel Open + Tab Hooks

**Files:**
- Modify: `extension/src/service-worker.ts`
- Modify: `extension/src/messages.ts`
- Modify: `extension/src/chrome-api.d.ts`
- Test: `extension/src/panel-lifecycle.test.ts`

**Interfaces:**
- Consumes: `configureExtensionPanel(tabId, url)` and `openExtensionPanel(tabId)`.
- Produces explicit `panel:open` handling before the async general dispatcher.

- [ ] **Step 1: Add failing source-order regression test**

Add a source-level regression assertion that the `panel:open` branch appears before creation/invocation of the async general message dispatcher and that it validates sender URL before opening.

- [ ] **Step 2: Verify RED**

Run: `cd extension && bun run test -- panel-lifecycle.test.ts`
Expected: FAIL against the current service-worker catch-all path.

- [ ] **Step 3: Implement immediate message branch**

At the top of `chrome.runtime.onMessage.addListener`:

```ts
if (isPanelOpenRequest(message)) {
  if (!isAllowedLeetCodeUrl(sender.url) || !sender.tab?.id) {
    sendResponse({ ok: false, error: "Panel open origin rejected" });
    return;
  }
  openExtensionPanel(sender.tab.id).then(
    () => sendResponse({ ok: true }),
    (error) => sendResponse({ ok: false, error: error instanceof Error ? error.message : "Panel open failed" }),
  );
  return true;
}
```

No catalog/sync/history awaits occur before `openExtensionPanel` is invoked.

- [ ] **Step 4: Add tab lifecycle listeners**

Use available tab events without adding `tabs` permission:

```ts
chrome.tabs?.onUpdated?.addListener((tabId, changeInfo, tab) => {
  const url = changeInfo.url ?? tab.url;
  if (url) void configureExtensionPanel(tabId, url);
});
chrome.tabs?.onActivated?.addListener(({ tabId }) => {
  void chrome.tabs?.get?.(tabId).then((tab) => configureExtensionPanel(tabId, tab.url));
});
```

If the actual typed API surface cannot provide `tabs.get` without permission safely, use sender-driven configuration plus `onUpdated` URL information only; do not widen permissions.

- [ ] **Step 5: Verify tests**

Run: `cd extension && bun run test -- panel-lifecycle.test.ts`
Expected: PASS.

---

### Task 3: Floating Launcher State Machine

**Files:**
- Create: `extension/src/launcher-state.ts`
- Create: `extension/src/launcher-state.test.ts`
- Modify: `extension/src/content.ts`
- Modify: `extension/content.css`

**Interfaces:**
- Produces:

```ts
export type LauncherMode = "expanded" | "minimized";
export type LauncherEvent = "minimize" | "panel-opened" | "restore";
export function nextLauncherMode(mode: LauncherMode, event: LauncherEvent): LauncherMode;
```

- [ ] **Step 1: Write failing state tests**

```ts
expect(nextLauncherMode("expanded", "minimize")).toBe("minimized");
expect(nextLauncherMode("expanded", "panel-opened")).toBe("minimized");
expect(nextLauncherMode("minimized", "restore")).toBe("expanded");
expect(nextLauncherMode("minimized", "minimize")).toBe("minimized");
```

- [ ] **Step 2: Verify RED**

Run: `cd extension && bun run test -- launcher-state.test.ts`
Expected: FAIL because module does not exist.

- [ ] **Step 3: Implement pure reducer**

Use an explicit switch over event; no persistence/network calls.

- [ ] **Step 4: Rework `content.ts` rendering**

Keep a module-level `let launcherMode: LauncherMode = "expanded";` so SPA navigation preserves mode while full reload resets it.

Expanded rendering includes:
- Leet Progress label
- priority score
- problem title/meta
- `Open panel` button
- quiet `Minimize` button

On successful `panel:open`, transition `panel-opened` then rerender current slug. On failure, remain expanded and set button title/text to lightweight retry feedback.

Minimized rendering uses a keyboard-accessible `<button class="lp-minimized">LP <strong>{score}</strong></button>`; click/Enter restores expanded mode.

Leaving a problem route removes the root but does not write launcher state to extension storage.

- [ ] **Step 5: Add CSS**

Expanded card stays in current visual family. Minimized width must be substantially smaller than 220px, with dark-mode variables already used by the card. Add `:focus-visible` for all launcher controls.

- [ ] **Step 6: Verify GREEN**

Run: `cd extension && bun run test -- launcher-state.test.ts`
Expected: PASS.

---

### Task 4: Reconciliation Metadata State

**Files:**
- Create: `extension/src/history-reconcile.ts`
- Create: `extension/src/history-reconcile.test.ts`
- Modify: `extension/src/service-worker.ts`
- Modify: `extension/src/chrome-api.d.ts`

**Interfaces:**

```ts
export type HistoryReconcileState = {
  needed: boolean;
  lastReconciledAt: string | null;
  lastSolvedCount: number | null;
};
export const DEFAULT_HISTORY_RECONCILE_STATE: HistoryReconcileState;
export function normalizeHistoryReconcileState(value: unknown): HistoryReconcileState;
export function markHistoryReconcileNeeded(state: HistoryReconcileState): HistoryReconcileState;
export function markHistoryReconcileSuccess(state: HistoryReconcileState, at: string, solvedCount: number): HistoryReconcileState;
```

- [ ] **Step 1: Write failing tests**

Verify default pending state, success metadata, malformed-storage fallback, and failure preserving prior success metadata while setting `needed: true`.

- [ ] **Step 2: Verify RED**

Run: `cd extension && bun run test -- history-reconcile.test.ts`
Expected: FAIL because module does not exist.

- [ ] **Step 3: Implement state helpers**

Use one `chrome.storage.local` key, e.g. `leetProgressHistoryReconcile`, containing metadata only.

- [ ] **Step 4: Service-worker lifecycle**

On `runtime.onInstalled`, mark reconciliation needed before/alongside OTA refresh. Add `runtime.onStartup` listener that marks reconciliation needed. Do not create/navigate tabs.

When `progress:history-import` succeeds, set `needed:false`, `lastReconciledAt: observedAt`, `lastSolvedCount: normalized mutation count`. If the import handler rejects/fails, never delete progress and leave/set `needed:true`.

- [ ] **Step 5: Verify GREEN**

Run: `cd extension && bun run test -- history-reconcile.test.ts`
Expected: PASS.

---

### Task 5: Automatic Progress-Page Reconciliation UX

**Files:**
- Modify: `extension/src/progress-import.ts`
- Modify: `extension/src/messages.ts`
- Test: `extension/src/history-import.test.ts`
- Test: `extension/src/history-reconcile.test.ts`

**Interfaces:**
- Progress page automatically posts `HISTORY_REQUEST_TYPE` once when initialized.
- Retry button repeats the same request only after failure.
- Successful service-worker response reports imported count and reconciliation metadata remains local.

- [ ] **Step 1: Add failing source behavior test**

Assert `progress-import.ts` initiates a request during initialization without waiting for button click, and retains a retry control only for failure.

- [ ] **Step 2: Verify RED**

Run: `cd extension && bun run test -- history-import.test.ts history-reconcile.test.ts`
Expected: FAIL because current code requires an initial click.

- [ ] **Step 3: Implement automatic request function**

Extract:

```ts
function requestHistory(button: HTMLButtonElement) {
  if (activeRequestId) return;
  activeRequestId = crypto.randomUUID();
  button.disabled = true;
  button.textContent = "Syncing solved history…";
  window.postMessage({ type: HISTORY_REQUEST_TYPE, requestId: activeRequestId }, window.location.origin);
}
```

Call it immediately after creating/mounting the compact status panel. On success show `Solved history current` or `Synced N solved problems`; on failure show `Retry solved-history sync` and wire click to `requestHistory`.

The status surface must mention that data stays local and must not be modal-sized/intrusive.

- [ ] **Step 4: Preserve idempotence**

Keep deterministic IDs `extension:history-import:${slug}` from `createHistoryImportMutations`; repeated page loads produce zero duplicate local mutations.

- [ ] **Step 5: Verify GREEN**

Run: `cd extension && bun run test -- history-import.test.ts history-reconcile.test.ts`
Expected: PASS.

---

### Task 6: Manifest/Firefox/Permission Regression

**Files:**
- Modify only if needed: `extension/manifest.json`
- Modify only if needed: `extension/src/manifest-transform.ts`
- Modify: `extension/src/hardening.test.ts`
- Modify: `extension/src/manifest-transform.test.ts`

**Interfaces:**
- Chromium keeps `sidePanel` permission and `side_panel.default_path` for packaged side-panel content, but runtime `setOptions` decides per-tab enablement.
- Firefox transform removes `sidePanel` permission and retains `sidebar_action` fallback.

- [ ] **Step 1: Add regression assertions**

Assert permissions remain exactly `alarms`, `sidePanel`, `storage`; host permissions remain exactly the two current origins; no `tabs`; Firefox output contains `sidebar_action` and no `side_panel`/`sidePanel` permission.

- [ ] **Step 2: Run extension suite**

Run: `cd extension && bun run test`
Expected: PASS after Tasks 1–5; fix only genuine manifest/runtime incompatibilities.

- [ ] **Step 3: Build both browsers**

Run: `cd extension && bun run build:all`
Expected: Chromium `dist/` and Firefox `dist-firefox/` build successfully.

---

### Task 7: Full Repository Verification and Single Push

**Files:**
- Include approved spec and this plan in the final feature tree.
- No unrelated source changes.

- [ ] **Step 1: Run full verification**

```bash
bun run test
bun run privacy:audit
bun packages/catalog/src/validate-cli.ts
cd frontend && bunx next typegen && bun run typecheck && bun run build
cd ../extension && bun run test && bun run build:all
```

Expected: all commands exit 0.

- [ ] **Step 2: Inspect diff**

Confirm changes are limited to extension lifecycle/reconciliation files plus approved spec/plan. No user-data cloud path, wildcard permission, `chrome.storage.sync`, or unrelated website changes.

- [ ] **Step 3: Push once**

Create/update one branch `feat/extension-tab-lifecycle-progress-sync` to the final GREEN commit only after detached RED/GREEN verification is complete.

- [ ] **Step 4: Open one PR**

Base: `main`. Run existing full CI without adding intermediate commits unless CI identifies a real defect.

- [ ] **Step 5: Merge only verified head**

Use exact head SHA after CI succeeds; then verify `main` points to the merged/fast-forwarded tree.

---

## Self-Review

### Spec coverage

- Reliable panel open: Tasks 1–2.
- LeetCode-only Chromium tab scoping: Tasks 1–2.
- Expanded/minimized launcher and SPA preservation: Task 3.
- Automatic Progress-page sync: Tasks 4–5.
- Install/update/startup reconciliation intent without hidden tabs: Task 4.
- Idempotent solved-history import: Task 5.
- Failure preserves existing progress: Tasks 4–5.
- Firefox supported fallback: Task 6.
- Dark mode/accessibility preservation: Task 3 + full build/test gate.
- No cloud user state/new broad permissions: Global constraints + Task 6/7.

### Placeholder scan

No TODO/TBD/placeholder implementation steps are present.

### Type consistency

`LauncherMode`, `LauncherEvent`, `PanelOptions`, and `HistoryReconcileState` are defined once in their owning modules and consumed by later tasks with the same names/signatures.
