import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { panelOptionsForUrl } from "./panel-lifecycle";

describe("panel lifecycle", () => {
  it("enables LeetCode tabs and disables everything else", () => {
    expect(panelOptionsForUrl("https://leetcode.com/problems/two-sum/")).toEqual({ enabled: true, path: "sidepanel.html" });
    expect(panelOptionsForUrl("https://leetcode.com/progress/")).toEqual({ enabled: true, path: "sidepanel.html" });
    expect(panelOptionsForUrl("https://github.com/rajeet-04")).toEqual({ enabled: false });
    expect(panelOptionsForUrl(undefined)).toEqual({ enabled: false });
  });

  it("handles panel:open before the asynchronous general dispatcher", () => {
    const source = readFileSync(path.resolve(import.meta.dirname, "service-worker.ts"), "utf8");
    const openBranch = source.indexOf('message.type === "panel:open"');
    const dispatcher = source.indexOf("void (async (): Promise<ExtensionResponse>");
    expect(openBranch).toBeGreaterThanOrEqual(0);
    expect(dispatcher).toBeGreaterThan(openBranch);
    expect(source.slice(openBranch, dispatcher)).toContain("isAllowedLeetCodeUrl(sender.url)");
    expect(source.slice(openBranch, dispatcher)).toContain("openExtensionPanel(sender.tab.id)");
  });
});
