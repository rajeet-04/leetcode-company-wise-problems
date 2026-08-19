import { describe, expect, it } from "vitest";
import manifest from "../manifest.json";
import { toFirefoxManifest, type ChromiumManifest } from "./manifest-transform";

describe("Firefox manifest transformation", () => {
  it("converts only browser-specific background/sidebar/main-world pieces", () => {
    const firefox = toFirefoxManifest(manifest as ChromiumManifest);

    expect(firefox.background).toEqual({ scripts: ["service-worker.js"] });
    expect(firefox.sidebar_action).toEqual({
      default_panel: "sidepanel.html",
      default_title: "Leet Progress",
    });
    expect(firefox.permissions.sort()).toEqual(["alarms", "storage"]);
    expect(firefox.host_permissions.sort()).toEqual([
      "https://leet-progress-eta.vercel.app/*",
      "https://leetcode.com/*",
    ]);
    expect(JSON.stringify(firefox)).not.toContain("side_panel");
    expect(JSON.stringify(firefox)).not.toContain("sidePanel");

    const loader = firefox.content_scripts.find((script) => script.js.includes("page-hook-loader.js"));
    expect(loader?.matches).toEqual(["https://leetcode.com/problems/*"]);
    expect(loader).not.toHaveProperty("world");
    expect(firefox.web_accessible_resources).toEqual([
      { resources: ["page-submission-hook.js"], matches: ["https://leetcode.com/*"] },
    ]);
  });

  it("is deterministic and does not mutate the Chromium manifest", () => {
    const source = structuredClone(manifest) as ChromiumManifest;
    const first = toFirefoxManifest(source);
    const second = toFirefoxManifest(source);

    expect(first).toEqual(second);
    expect(source.background).toEqual({ service_worker: "service-worker.js" });
    expect(source.permissions).toContain("sidePanel");
    expect(source.content_scripts[0]?.world).toBe("MAIN");
  });
});
