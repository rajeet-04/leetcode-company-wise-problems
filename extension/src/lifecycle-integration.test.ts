import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import manifest from "../manifest.json";

describe("LeetCode-scoped extension lifecycle", () => {
  it("loads page-world hooks only on the LeetCode routes that need them", () => {
    const scope = manifest.content_scripts.find((script) => script.js.includes("panel-scope.js"));
    expect(scope?.matches).toEqual(["https://leetcode.com/*"]);

    const submissionHook = manifest.content_scripts.find((script) => script.js.includes("page-submission-hook.js"));
    expect(submissionHook?.matches).toEqual(["https://leetcode.com/problems/*"]);
    expect(submissionHook?.world).toBe("MAIN");

    const historyHook = manifest.content_scripts.find((script) => script.js.includes("page-history-import-hook.js"));
    expect(historyHook?.matches).toEqual(["https://leetcode.com/progress/*"]);
    expect(historyHook?.world).toBe("MAIN");
  });

  it("keeps launcher mode page-session local and minimizes only after successful open", () => {
    const content = readFileSync(path.resolve(import.meta.dirname, "content.ts"), "utf8");
    expect(content).toContain('let launcherMode: LauncherMode = "expanded"');
    expect(content).toContain('nextLauncherMode(launcherMode, "panel-opened")');
    expect(content).toContain('nextLauncherMode(launcherMode, "restore")');
    expect(content).toContain('dataset.mode = "minimized"');
  });

  it("requests and uses only the least-privilege browser APIs", () => {
    expect([...manifest.permissions].sort()).toEqual(["alarms", "sidePanel", "storage"]);
    expect([...manifest.host_permissions].sort()).toEqual(["https://leet.rajeet.in/*", "https://leetcode.com/*"]);
    expect(manifest.permissions).not.toContain("scripting");
    expect(manifest.permissions).not.toContain("tabs");

    const worker = readFileSync(path.resolve(import.meta.dirname, "service-worker.ts"), "utf8");
    expect(worker).not.toContain("chrome.scripting");
    expect(worker).not.toContain("chrome.tabs");
  });
});
