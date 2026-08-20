import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (file: string) => fs.readFileSync(path.join(root, file), "utf8");

async function pngStats(file: string): Promise<{ width: number; height: number; visibleRatio: number; luminanceRange: number }> {
  const filePath = path.join(root, file);
  const metadata = await sharp(filePath).metadata();
  const { data, info } = await sharp(filePath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let visible = 0;
  let minLum = 255;
  let maxLum = 0;

  for (let offset = 0; offset < data.length; offset += info.channels) {
    const alpha = data[offset + 3] ?? 255;
    if (alpha < 32) continue;
    visible += 1;
    const lum = Math.round((data[offset] ?? 0) * 0.2126 + (data[offset + 1] ?? 0) * 0.7152 + (data[offset + 2] ?? 0) * 0.0722);
    minLum = Math.min(minLum, lum);
    maxLum = Math.max(maxLum, lum);
  }

  return {
    width: metadata.width ?? 0,
    height: metadata.height ?? 0,
    visibleRatio: visible / Math.max(1, info.width * info.height),
    luminanceRange: maxLum - minLum,
  };
}

describe("Chrome Web Store readiness", () => {
  it("ships required icon sizes that are visibly nonblank", async () => {
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
      const stats = await pngStats(`extension/icons/icon-${size}.png`);
      expect([stats.width, stats.height]).toEqual([size, size]);
      expect(stats.visibleRatio).toBeGreaterThan(0.45);
      expect(stats.luminanceRange).toBeGreaterThan(120);
    }
  });

  it("derives website and extension icons from one canonical Leet Progress mark", () => {
    const build = read("extension/scripts/build.ts");
    const shell = read("frontend/app/app-shell.tsx");
    const layout = read("frontend/app/layout.tsx");

    expect(build).toContain("frontend/public/leet-progress-mark.png");
    expect(build).toContain("generateBrandIcons");
    expect(shell).toContain("/leet-progress-icon.png");
    expect(layout).toContain("/leet-progress-icon.png");
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
