# Leet Progress Extension — Install Guide

Leet Progress is currently distributed as a developer-mode unpacked browser extension. The release ZIPs are built from this repository and published through GitHub Releases.

## Chromium / Microsoft Edge / Chrome

1. Download the latest **`leet-progress-chromium.zip`** from the repository's latest GitHub Release:
   - Releases: `https://github.com/rajeet-04/leetcode-company-wise-problems/releases/latest`
2. Extract the ZIP to a permanent folder. Do not select the ZIP itself in the browser.
3. Open the browser's extensions page:
   - Edge: `edge://extensions`
   - Chrome: `chrome://extensions`
4. Enable **Developer mode**.
5. Choose **Load unpacked**.
6. Select the extracted folder that directly contains `manifest.json` and `service-worker.js`.
7. Confirm **Leet Progress** appears in the extensions list and the service worker is available.

![Microsoft Edge extensions page with Developer mode enabled and Load unpacked visible](../frontend/public/extension-guide/edge-developer-mode.jpg)

![Leet Progress loaded successfully in Microsoft Edge](../frontend/public/extension-guide/edge-extension-loaded.jpg)

## First sync

After installation:

1. Sign in to LeetCode.
2. Open `https://leetcode.com/progress/`.
3. Leet Progress automatically reconciles the solved-problem set into local extension storage.
4. Open `https://leet-progress-eta.vercel.app/` in the same browser profile. The website and extension exchange local mutations through the website bridge.

No cloud user-profile backend is required. The extension uses browser-local storage for user state.

## Updating an unpacked install

1. Download the newest Chromium ZIP from the latest GitHub Release.
2. Replace the contents of your extracted extension folder with the new files.
3. Open `edge://extensions` or `chrome://extensions`.
4. Click **Reload** on Leet Progress.

## Firefox

Download **`leet-progress-firefox.zip`** from the same release. Firefox uses its temporary/debug add-on installation flow and a window-scoped sidebar rather than Chromium's tab-scoped side panel.

## Build from source

Developers can build both packages directly:

```bash
bun install --frozen-lockfile
cd extension
bun run build:all
```

Outputs:

- Chromium: `extension/dist/`
- Firefox: `extension/dist-firefox/`

The build fails if a generated manifest references a missing packaged file.
