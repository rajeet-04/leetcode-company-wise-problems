export type ContentScript = {
  matches: string[];
  js: string[];
  css?: string[];
  run_at?: string;
  world?: string;
};

export type ChromiumManifest = {
  manifest_version: number;
  name: string;
  version: string;
  description?: string;
  permissions: string[];
  host_permissions: string[];
  background: { service_worker: string };
  action?: Record<string, unknown>;
  side_panel?: { default_path: string };
  content_scripts: ContentScript[];
  [key: string]: unknown;
};

export type FirefoxManifest = Omit<ChromiumManifest, "background" | "side_panel" | "content_scripts"> & {
  background: { scripts: string[] };
  sidebar_action: { default_panel: string; default_title: string };
  content_scripts: ContentScript[];
  web_accessible_resources: Array<{ resources: string[]; matches: string[] }>;
  browser_specific_settings: { gecko: { id: string } };
};

export function toFirefoxManifest(input: ChromiumManifest): FirefoxManifest {
  const copy = structuredClone(input);
  const serviceWorker = copy.background.service_worker;
  const panelPath = copy.side_panel?.default_path ?? "sidepanel.html";

  const contentScripts = copy.content_scripts.map((script) => {
    if (script.world === "MAIN" && script.js.includes("page-submission-hook.js")) {
      return {
        matches: [...script.matches],
        js: ["page-hook-loader.js"],
        ...(script.run_at ? { run_at: script.run_at } : {}),
      };
    }
    const { world: _world, ...rest } = script;
    return rest;
  });

  const {
    background: _background,
    side_panel: _sidePanel,
    content_scripts: _contentScripts,
    ...rest
  } = copy;

  return {
    ...rest,
    permissions: copy.permissions.filter((permission) => permission !== "sidePanel"),
    host_permissions: [...copy.host_permissions],
    background: { scripts: [serviceWorker] },
    sidebar_action: { default_panel: panelPath, default_title: copy.name },
    content_scripts: contentScripts,
    web_accessible_resources: [
      { resources: ["page-submission-hook.js"], matches: ["https://leetcode.com/*"] },
    ],
    browser_specific_settings: {
      gecko: { id: "leet-progress@rajeet-04.github.io" },
    },
  };
}
