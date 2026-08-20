import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (file: string) => fs.readFileSync(path.join(root, file), "utf8");

function pngSize(file: string): [number, number] {
  const buffer = fs.readFileSync(path.join(root, file));
  expect(buffer.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
  return [buffer.readUInt32BE(16), buffer.readUInt32BE(20)];
}

describe("Chrome Web Store readiness", () => {
  it("ships the required raster icon sizes and targets a compatible Chrome version", () => {
    const manifest = JSON.parse(read("extension/manifest.json")) as {
      minimum_chrome_version?: string;
      icons?: Record<string, string>;
      action?: { default_icon?: Record<string, string> };
    };
    const expected = {
      "16": "icons/icon-16.png",
      "32": "icons/icon-32.png",
      "48": "icons/icon-48.png",
      "128": "icons/icon-128.png",
    };
    expect(manifest.minimum_chrome_version).toBe("116");
    expect(manifest.icons).toEqual(expected);
    expect(manifest.action?.default_icon).toEqual(expected);
    for (const size of [16, 32, 48, 128] as const) {
      expect(pngSize(`extension/icons/icon-${size}.png`)).toEqual([size, size]);
    }
  });

  it("publishes a comprehensive privacy disclosure for local LeetCode data handling", () => {
    const privacy = read("frontend/app/privacy/page.tsx");
    for (const phrase of [
      "LeetCode problem",
      "solved-problem history",
      "submission result",
      "existing LeetCode session",
      "do not collect your LeetCode password",
      "not sold",
      "not shared with advertisers",
      "delete",
      "github.com/rajeet-04/leetcode-company-wise-problems/issues",
      "Last updated",
    ]) expect(privacy).toContain(phrase);
  });

  it("keeps reviewer-facing Chrome Web Store declarations in version control", () => {
    const store = read("docs/CHROME_WEB_STORE.md");
    expect(store).toContain("Single purpose");
    expect(store).toContain("Remote code: No");
    expect(store).toContain("Chrome 116+");
    expect(store).toContain("https://leet.rajeet.in/privacy");
    expect(store).toContain("storage");
    expect(store).toContain("sidePanel");
    expect(store).toContain("alarms");
    expect(store).toContain("LeetCode");
    expect(store).toContain("public JSON catalog");
    expect(store).toContain("not evaluated as code");
  });
});
