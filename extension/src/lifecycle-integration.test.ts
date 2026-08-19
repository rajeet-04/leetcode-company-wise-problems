import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import manifest from "../manifest.json";

describe("LeetCode-scoped extension lifecycle", () => {
  it("loads the lightweight scope controller without a CSP-sensitive DOM hook loader", () => {
    const scope = manifest.content_scripts.find((script) => script.js.includes("panel-scope.js"));
    expect(scope?.matches).toEqual(["https://leetcode.com/*"]);
    const historyLoader = manifest.content_scripts.find((script) => script.js.includes("page-history-hook-loader.js"));
    expect(historyLoader).toBeUndefined();
    expect(manifest.web_accessible_resources).toBeUndefined();
  });

  it("keeps launcher mode page-session local and minimizes only after successful open", () => {
    const content = readFileSync(path.resolve(import.meta.dirname, "content.ts"), "utf8");
    expect(content).toContain('let launcherMode: LauncherMode = "expanded"');
    expect(content).toContain('nextLauncherMode(launcherMode, "panel-opened")');
    expect(content).toContain('nextLauncherMode(launcherMode, "restore")');
    expect(content).toContain('dataset.mode = "minimized"');
  });

  it("grants only the permissions needed for local state, UI, alarms, and page-world history injection", () => {
    expect([...manifest.permissions].sort()).toEqual(["alarms", "scripting", "sidePanel", "storage"]);
    expect([...manifest.host_permissions].sort()).toEqual(["https://leet-progress-eta.vercel.app/*", "https://leetcode.com/*"]);
    expect(manifest.permissions).not.toContain("tabs");
  });
});
