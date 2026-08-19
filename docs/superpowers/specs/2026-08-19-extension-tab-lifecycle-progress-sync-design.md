# Extension Tab Lifecycle and Progress Reconciliation Design

Date: 2026-08-19
Status: Approved interaction design, pending written-spec review
Parent release commit: `7f43999016ab73ac2412c4c5cd0a3f424a4212bc`

## Goal

Make the Leet Progress extension behave like a LeetCode-scoped companion rather than a browser-global panel, while fixing panel opening, reducing floating UI disruption, and reconciling the user's solved LeetCode history automatically whenever the Progress page is available.

The extension must remain local-first. No cloud user-state backend, `chrome.storage.sync`, remote telemetry, or new broad browser permissions are introduced.

## User Outcomes

1. Clicking **Open panel** from the floating Leet Progress card reliably opens the Chromium side panel.
2. The Leet Progress side panel is enabled only for LeetCode tabs. Switching to unrelated tabs hides it; returning to the same LeetCode tab restores the tab-scoped panel state.
3. The first problem in a newly loaded LeetCode tab shows the existing informative floating card. After the user closes/minimizes it or successfully opens the side panel, the card collapses into a small unobtrusive launcher.
4. The minimized launcher remains available on LeetCode problem pages so the user can restore the richer card without occupying meaningful screen space.
5. Loading `https://leetcode.com/progress/` automatically reconciles the full solved-problem set into local Leet Progress state without requiring a manual import click.
6. Extension install/update/startup marks solved-history reconciliation as needed. If a usable LeetCode page is already available, reconciliation is requested there; otherwise it runs automatically the next time the Progress page is loaded. The extension must not silently open LeetCode tabs.
7. Repeated solved-history reconciliation is idempotent.
8. Existing live submission capture continues to record accepted/failed submissions prospectively.

## Current Problems

### Panel open bug

`extension/src/content.ts` sends `{ type: "panel:open" }` from the user's button click. The service worker currently handles all messages through an async dispatch path before eventually calling `openExtensionPanel(sender.tab?.id)`. Chromium's side-panel opening must stay associated with the original user gesture, so asynchronous work before `chrome.sidePanel.open()` can invalidate the gesture and cause the button to appear non-functional.

### Browser-global side panel behavior

`extension/manifest.json` declares a global `side_panel.default_path`. The extension does not currently configure tab-specific side-panel enablement. Once opened, the panel can therefore remain visible while the user moves to unrelated tabs.

### Floating card lifecycle

`extension/src/content.ts` creates the same full-size card on every supported problem route and does not track expanded/minimized state. It therefore cannot become less intrusive after the user understands the feature.

### Progress import remains user-triggered

`extension/src/progress-import.ts` currently creates an import panel on the LeetCode Progress page and waits for the user to click **Import solved history**. The main-world adapter and history query already support paginated solved-history retrieval, but the request is not initiated automatically.

## Architecture

The change is split into four independent units:

1. **Tab panel lifecycle controller** — Chromium-specific side-panel enable/open behavior and Firefox fallback.
2. **Problem launcher state machine** — expanded/minimized floating card behavior on LeetCode problem pages.
3. **Automatic progress reconciliation controller** — automatic solved-history request and idempotent local mutation application.
4. **Browser runtime adapter** — preserves the existing single codebase while isolating Chrome side-panel and Firefox sidebar differences.

Shared intelligence, recommendations, progress reducers, plans, analytics, local website sync, and catalog OTA logic remain unchanged.

## 1. Tab Panel Lifecycle Controller

### Chromium behavior

The service worker will configure Leet Progress side-panel availability per tab.

For a LeetCode tab:

```text
LeetCode URL detected
  -> sidePanel.setOptions({ tabId, path: "sidepanel.html", enabled: true })
```

For a non-LeetCode tab:

```text
non-LeetCode tab
  -> sidePanel.setOptions({ tabId, enabled: false })
```

The lifecycle controller will react to tab activation and tab URL updates. It will not request the broad `tabs` permission; the implementation will use the minimum tab metadata available from extension events and sender context.

### Reliable panel opening

`panel:open` becomes a special, immediate message path. The service worker must call the browser runtime panel-open function before any unrelated awaited work.

Required ordering:

```text
content-script click
  -> runtime.sendMessage(panel:open)
  -> service-worker message listener
  -> validate sender is LeetCode
  -> immediately call openExtensionPanel(tabId)
  -> respond success/failure
```

No catalog lookup, sync-state read, history reconciliation, or other async operation may run before the panel-open attempt.

After the content script receives a successful `panel:open` response, it minimizes the floating launcher.

### Restore behavior

Chromium's tab-specific side-panel state is relied upon for the desired behavior:

- LeetCode tab with panel open -> panel visible.
- Switch to unrelated tab where Leet Progress panel is disabled -> panel hidden.
- Return to the same LeetCode tab -> panel available again for that tab.

The extension will not attempt to emulate this by injecting or removing arbitrary DOM on non-LeetCode pages.

### Firefox behavior

Firefox retains the current sidebar-based implementation because its sidebar is window-scoped rather than Chrome-style tab-scoped.

The runtime adapter will:

- preserve `sidebarAction.open()` where supported;
- avoid pretending Firefox supports Chrome's per-tab auto-hide lifecycle;
- keep data and recommendation behavior identical;
- render a minimal/non-active state when the current context is not a LeetCode problem where practical.

No separate Firefox business-logic fork is introduced.

## 2. Floating Problem Launcher State Machine

### States

```ts
type LauncherMode = "expanded" | "minimized";
```

The state is tab/page-session local, not synced to the website or cloud.

### Initial state

On the first recognized problem after a full page load, mode is `expanded`.

Expanded layout keeps the existing useful summary:

- Leet Progress label
- priority score
- current problem title
- difficulty/company/target-overlap metadata
- **Open panel**
- minimize control

### Minimized state

Minimized form is deliberately compact and low-interference. It contains only a recognizable Leet Progress marker and the current priority score, positioned near the bottom-right edge with a smaller footprint than the existing card.

Clicking the minimized launcher restores `expanded` mode.

### Transitions

```text
initial problem load -> expanded
expanded + minimize click -> minimized
expanded + successful Open panel -> minimized
minimized + launcher click -> expanded
SPA navigation to another problem -> preserve current mode
full page reload/new LeetCode tab -> expanded
leaving problem route -> remove problem launcher
```

The launcher must not cover primary LeetCode controls and must remain keyboard accessible.

### Error behavior

If opening the side panel fails, the card stays expanded and surfaces a lightweight failure state/title rather than minimizing as though opening succeeded.

## 3. Automatic Solved-History Reconciliation

### Scope of historical data

The current LeetCode history query reliably returns problem-level solved status. Therefore automatic reconciliation guarantees the solved-problem set only.

It does not invent historical attempt counts, historical submission timestamps, or past failed submissions that the source query does not provide.

Live submission capture continues to record new attempts/accepts prospectively.

### Progress page behavior

When `https://leetcode.com/progress/` loads, the isolated content script automatically sends a history request to the already-packaged main-world query adapter.

```text
Progress page load
  -> automatic history request
  -> main-world paginated GraphQL query
  -> validated sorted solved slugs
  -> progress:history-import message
  -> deterministic local mutations
  -> extension local state
  -> website receives changes through existing local sync bridge when available
```

The old user-triggered import button is no longer required for normal reconciliation. A small status-only surface may remain if useful for showing `syncing`, `up to date`, or `retry` states, but it must not require an initial click.

### Idempotence

History-import mutation IDs remain deterministic for the same solved slug/import identity so repeated reconciliation does not duplicate progress.

Required behavior:

```text
first run: 1000 solved -> 1000 solved locally
second run: same 1000 -> still 1000
reload Progress page -> still 1000
browser restart then Progress page -> still 1000
```

### Startup/install reconciliation intent

The service worker stores a small local reconciliation intent flag such as:

```ts
{ historyReconcileNeeded: true }
```

Set on:

- extension install;
- extension update;
- browser/service-worker startup when previous reconciliation is unknown/stale.

The flag contains no user history itself.

If a supported LeetCode context capable of running the history adapter is already present, the extension may request reconciliation. Otherwise the flag remains pending until the Progress page is next loaded.

The extension must not silently create or navigate tabs solely for reconciliation.

### Completion state

After a successful import, store local metadata such as:

```ts
{
  historyReconcileNeeded: false,
  lastHistoryReconciledAt: ISODateString,
  lastHistorySolvedCount: number
}
```

This metadata remains extension-local and may be used for diagnostics only.

### Failure behavior

If LeetCode is logged out, GraphQL changes schema, the request fails, or the page closes mid-request:

- preserve existing progress;
- do not clear solved state;
- keep `historyReconcileNeeded: true`;
- expose a retry state on the Progress page;
- retry next time Progress loads or the user explicitly retries.

## 4. Message and Storage Contracts

### New/adjusted messages

The message union will explicitly represent panel lifecycle and automatic history requests rather than using implicit catch-all behavior.

Expected contract additions may include:

```ts
type OpenPanelRequest = { type: "panel:open" };
type PanelConfigureRequest = { type: "panel:configure"; isLeetCode: boolean };
type HistoryReconcileStatusRequest = { type: "progress:history-status" };
```

Exact names may be adjusted during implementation as long as type guards remain exhaustive and testable.

### Local extension storage

New local-only UI/reconciliation metadata may include:

- pending history reconciliation flag;
- last reconciliation timestamp;
- last solved count.

Launcher expanded/minimized mode should stay page-session local unless implementation constraints make tab-local extension storage materially simpler. It must not be synced to the website.

## 5. Security and Privacy

No new cloud user-data path is introduced.

Allowed networking remains:

- LeetCode authenticated requests from the LeetCode page context to reconcile the user's own solved history;
- public Catalog V2 refresh from `https://leet-progress-eta.vercel.app/catalog`.

Forbidden:

- sending solved-history payloads to Vercel or any remote user-data API;
- `chrome.storage.sync`;
- broad wildcard host permissions;
- automatically opening hidden/background LeetCode tabs for reconciliation;
- remote executable JavaScript.

The service worker must validate sender URLs for panel/history messages using the existing LeetCode-origin policy.

## 6. Product Design Requirements

The implementation should preserve the existing visual language rather than redesigning the extension.

### Expanded launcher

- same visual family as the current floating card;
- clear priority score and title;
- one primary **Open panel** action;
- one quiet minimize affordance;
- keyboard focus visible;
- dark-mode styling preserved.

### Minimized launcher

- visually quieter than the current card;
- small enough not to compete with LeetCode's editor/test controls;
- recognizable as Leet Progress;
- includes current priority score when available;
- expands on click/keyboard activation.

### Progress-page status

Automatic reconciliation should not show a modal or intrusive card on every visit. Prefer a compact status surface:

- `Syncing solved history…`
- `Solved history current`
- `Retry solved-history sync`

The surface should communicate that progress remains local.

## 7. Files Expected to Change

Primary files:

- `extension/src/content.ts`
- `extension/content.css`
- `extension/src/service-worker.ts`
- `extension/src/browser-runtime.ts`
- `extension/src/messages.ts`
- `extension/src/progress-import.ts`
- `extension/src/history-import.ts`
- `extension/src/chrome-api.d.ts`
- `extension/manifest.json`
- `extension/src/manifest-transform.ts` if Firefox packaging requires lifecycle-specific transformation

Likely new focused modules/tests:

- `extension/src/panel-lifecycle.ts`
- `extension/src/panel-lifecycle.test.ts`
- `extension/src/launcher-state.ts`
- `extension/src/launcher-state.test.ts`
- `extension/src/history-reconcile.ts`
- `extension/src/history-reconcile.test.ts`

No shared intelligence/recommendation/analytics package changes are expected.

## 8. Testing Strategy

Implementation follows TDD.

### Panel lifecycle tests

Verify:

- LeetCode URL enables a Chromium tab side panel;
- non-LeetCode URL disables it;
- `panel:open` validates sender origin;
- panel open is attempted before unrelated async work;
- failed open leaves launcher expanded;
- successful open minimizes launcher;
- Firefox adapter does not assume `chrome.sidePanel` exists.

### Launcher tests

Verify state transitions:

- initial -> expanded;
- minimize -> minimized;
- successful panel open -> minimized;
- minimized click -> expanded;
- SPA problem change preserves mode;
- leaving problem route removes the launcher.

### History reconciliation tests

Verify:

- Progress-page load starts reconciliation without a user click;
- valid solved-history result creates deterministic mutations;
- same result imported twice is idempotent;
- successful import clears pending flag and records local metadata;
- failed/schema-changed/logged-out result preserves existing progress and keeps pending flag;
- no hidden tab is opened;
- history payload never uses website/cloud APIs.

### Regression gates

Run the existing full repository gate:

- shared tests;
- local-first privacy audit;
- Catalog V2 validation;
- frontend typecheck/build;
- extension tests;
- Chromium build;
- Firefox build.

## 9. Release Strategy

To conserve Vercel's deployment quota:

1. Perform RED/GREEN development locally or through detached Git objects where possible.
2. Push one consolidated feature branch only after the implementation is green.
3. Open one PR.
4. Run the full permanent CI gate on the exact head.
5. Merge once to `main` after verification.

No intermediate Vercel preview should be intentionally generated for each TDD step.

## Acceptance Criteria

The phase is complete only when all of the following are true:

- **Open panel** works from the floating LeetCode card in Chromium.
- Side panel is enabled only for LeetCode tabs in Chromium.
- Switching away from LeetCode hides the Leet Progress side panel; returning restores availability for that LeetCode tab.
- Initial problem launcher is expanded and can minimize.
- Successful panel open minimizes the launcher.
- Minimized launcher can restore the expanded card.
- SPA problem navigation preserves minimized/expanded mode.
- Progress-page load automatically reconciles solved history.
- Reconciliation is idempotent and never clears existing progress on failure.
- Install/update/startup records pending reconciliation without silently opening a tab.
- Existing live submission capture still works.
- Dark mode remains correct.
- No new cloud user-data path or broad permission is introduced.
- Chromium and Firefox builds both pass, with Firefox using its supported sidebar fallback.
