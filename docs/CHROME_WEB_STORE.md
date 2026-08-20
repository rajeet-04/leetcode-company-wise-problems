# Chrome Web Store submission sheet

This file is the canonical source for Chrome Web Store listing copy, privacy declarations, permission justifications, and reviewer notes for Leet Progress.

## Product identity

**Name:** Leet Progress

**Category:** Productivity / Developer Tools

**Homepage:** https://leet.rajeet.in/

**Privacy policy:** https://leet.rajeet.in/privacy

**Support:** https://github.com/rajeet-04/leetcode-company-wise-problems/issues

**Minimum Chrome:** Chrome 116+. The extension programmatically opens the Side Panel, and `chrome.sidePanel.open()` is available from Chrome 116.

**Not affiliated with LeetCode:** Leet Progress is an independent interview-preparation companion and is not endorsed by or affiliated with LeetCode.

## Single purpose

Leet Progress is a local-first LeetCode interview-preparation companion that shows company-aware problem intelligence, tracks the user's own solving progress, and recommends what to practice next while the user works on LeetCode.

All extension features directly support that single purpose: contextual company intelligence, solved-history reconciliation, submission-result progress updates, local plans/revision state, readiness, recommendations, and local website-extension synchronization.

## Short description

Local-first company intelligence, progress tracking, and next-problem recommendations for LeetCode interview preparation.

## Detailed listing description

Leet Progress helps you decide what to solve next for the companies you care about and understand why a problem matters.

On supported LeetCode pages, the extension can show company coverage, interview priority, recommendations, target-company readiness, plan context, and revision information. When you choose to use progress features, Leet Progress can reconcile your own solved-problem history and observe your own submission result so progress updates automatically.

Personal preparation data stays in browser-local storage. Leet Progress does not use a cloud user-profile database, does not sell personal data, does not share personal preparation data with advertisers, and does not use chrome.storage.sync.

The extension periodically checks https://leet.rajeet.in for a public company/problem catalog. The downloaded catalog is JSON data only, is version/checksum validated, and is never evaluated as executable code.

Leet Progress is independent and is not affiliated with or endorsed by LeetCode.

## Permission justifications

### `storage`

Required to keep extension-local progress mutations, preferences, current problem state, history-reconciliation state, and the validated public catalog cache. Personal progress is stored locally and is not uploaded to Leet Progress servers.

### `sidePanel`

Required to show contextual problem intelligence and recommendations beside the LeetCode problem the user is currently solving.

### `alarms`

Required to check the public catalog metadata periodically. The current cadence is every six hours. If the version/checksum is unchanged, the full catalog is not downloaded again.

### Host permission: `https://leetcode.com/*`

Required for the extension's disclosed single purpose on LeetCode: identify the current problem, display contextual UI, reconcile the signed-in user's own solved-problem history, and observe the user's own submission result so local progress can update. Leet Progress does not collect the user's LeetCode password or copy authentication cookies.

### Host permission: `https://leet.rajeet.in/*`

Required for two narrowly scoped features: downloading the public JSON problem/company catalog and allowing the Leet Progress website to exchange local mutations with the installed extension in the same browser profile. Personal user data is not sent to a Leet Progress server by this bridge.

## Permissions intentionally not requested

- `tabs`: not requested. The service worker does not enumerate or open browser tabs; tab IDs used for the side panel come from the sender of a user/page interaction.
- `scripting`: not requested. Page-world observers are packaged static content scripts limited to the exact LeetCode routes that need them.
- `history`: not requested.
- `cookies`: not requested.
- `webRequest`: not requested.
- `storage.sync`: not used.

## User-data disclosure guidance

Chrome Web Store privacy declarations must match the behavior and https://leet.rajeet.in/privacy.

The extension locally handles data that may fall under the dashboard's user-activity / browsing / website-content categories:

- current LeetCode problem URL/slug;
- solved-problem slugs returned by LeetCode for the signed-in user;
- the user's own submission outcome, plus a submission identifier/timestamp/runtime/memory value when LeetCode supplies one for local deduplication;
- local progress, targets, plans, revision state, preferences, notes and derived personal analytics.

These values are used only for the extension's disclosed interview-preparation purpose and related local operation. They are not sold, shared with advertisers, or used for personalized advertising.

Authentication information: **do not declare that Leet Progress collects passwords or cookie values.** The solved-history request uses the browser's existing authenticated LeetCode session with credentials included by the browser; the extension does not copy or persist the credential itself.

## Remote code

**Remote code: No.**

All executable JavaScript used by the extension is packaged in the submitted extension ZIP. Leet Progress periodically downloads a public JSON catalog from https://leet.rajeet.in/catalog. The catalog contains problem/company data only. It is schema/version/checksum validated, stored as data, and not evaluated as code. The extension does not use `eval`, `new Function`, remote script tags, remote module imports, WebAssembly downloaded at runtime, or remotely supplied executable logic.

## Reviewer notes

Suggested reviewer note:

> Leet Progress is a Manifest V3, local-first companion for LeetCode interview preparation. No Leet Progress account is required. Basic contextual intelligence can be reviewed by installing the extension and opening a public LeetCode problem page. The side panel and popup use the packaged/public catalog. Optional personal progress features use the reviewer's own LeetCode session: on `https://leetcode.com/progress/`, a packaged page-world script requests the reviewer's own solved-problem list from LeetCode and returns only solved slugs to local extension state; on problem pages, a packaged observer reads the reviewer's own submission-result response so local progress can update. These values remain local. `https://leet.rajeet.in` is used for a public JSON catalog and same-browser local website-extension bridge. No remote executable code is used.

## Reviewer test path

1. Install the Chromium ZIP produced from `extension/dist/` on Chrome 116 or newer.
2. Open any public `https://leetcode.com/problems/<slug>/` page.
3. Use the Leet Progress launcher/side panel to see catalog-backed company intelligence and recommendations.
4. Open the extension popup to confirm the same contextual state.
5. Optional signed-in test: visit `https://leetcode.com/progress/` to reconcile the reviewer's own solved history.
6. Optional signed-in test: submit a solution and confirm the local progress state updates from the resulting status.
7. Visit `https://leet.rajeet.in/privacy` for the public privacy policy.

A LeetCode login is not required to inspect the extension's core catalog-backed contextual UI. It is only required to exercise personal solved-history/submission features that depend on the reviewer's own LeetCode account.

## Store media checklist

Before public submission, upload truthful captures of the current extension only:

- 128 x 128 store icon from `extension/icons/icon-128.png`;
- at least one Chrome Web Store screenshot at an accepted size;
- recommended: problem-page launcher/context, side panel intelligence, recommendations/readiness, and local privacy/progress state;
- do not use mock functionality or claims not present in the submitted build.

## Final submission checklist

- [ ] Developer account email and 2-Step Verification are current.
- [ ] Upload a ZIP whose root contains `manifest.json`.
- [ ] Store listing copy matches this file and the shipped behavior.
- [ ] Privacy policy URL is `https://leet.rajeet.in/privacy` and is publicly reachable.
- [ ] Permission justifications match the exact manifest.
- [ ] User-data declarations match the privacy policy and actual local processing.
- [ ] Remote code answer is **No** and reviewer notes explain the public JSON catalog.
- [ ] Screenshots show the actual current extension experience.
- [ ] Support URL is reachable.
- [ ] Run shared tests, privacy audit, frontend production build, extension tests, and Chromium build before upload.
