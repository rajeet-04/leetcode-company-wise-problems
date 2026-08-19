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

const MAIN_WORLD_LOADERS: Record<string, string> = {
  "page-submission-hook.js": "page-hook-loader.js",
  "page-history-import-hook.js": "page-history-hook-loader.js",
};

export function toFirefoxManifest(input: ChromiumManifest): FirefoxManifest {
  const copy = structuredClone(input);
  const serviceWorker = copy.background.service_worker;
  const panelPath = copy.side_panel?.default_path ?? "sidepanel.html";

  const contentScripts = copy.content_scripts.map((script) => {
    if (script.world === "MAIN") {
      if (script.js.length !== 1) throw new Error("Firefox MAIN-world adapter requires one packaged script per content-script entry");
      const packagedScript = script.js[0]!;
      const loader = MAIN_WORLD_LOADERS[packagedScript];
      if (!loader) throw new Error(`No Firefox page-world loader registered for ${packagedScript}`);
      return {
        matches: [...script.matches],
        js: [loader],
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
      {
        resources: ["page-submission-hook.js", "page-history-import-hook.js"],
        matches: ["https://leetcode.com/*"],
      },
    ],
    browser_specific_settings: {
      gecko: { id: "leet-progress@rajeet-04.github.io" },
    },
  };
}
