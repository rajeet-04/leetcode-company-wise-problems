import fs from "node:fs";
import path from "node:path";
import { inflateSync } from "node:zlib";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (file: string) => fs.readFileSync(path.join(root, file), "utf8");

function pngSize(file: string): [number, number] {
  const buffer = fs.readFileSync(path.join(root, file));
  expect(buffer.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
  return [buffer.readUInt32BE(16), buffer.readUInt32BE(20)];
}

function rgbaPngContrast(file: string): { visibleRatio: number; luminanceRange: number } {
  const buffer = fs.readFileSync(path.join(root, file));
  expect(buffer.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  const bitDepth = buffer[24];
  const colorType = buffer[25];
  const interlace = buffer[28];
  expect(bitDepth).toBe(8);
  expect(colorType).toBe(6);
  expect(interlace).toBe(0);

  const idat: Buffer[] = [];
  let offset = 8;
  while (offset + 12 <= buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.subarray(offset + 4, offset + 8).toString("ascii");
    if (type === "IDAT") idat.push(buffer.subarray(offset + 8, offset + 8 + length));
    offset += 12 + length;
    if (type === "IEND") break;
  }

  const raw = inflateSync(Buffer.concat(idat));
  const stride = width * 4;
  const previous = Buffer.alloc(stride);
  const current = Buffer.alloc(stride);
  let rawOffset = 0;
  let visible = 0;
  let minLum = 255;
  let maxLum = 0;

  const paeth = (a: number, b: number, c: number) => {
    const p = a + b - c;
    const pa = Math.abs(p - a);
    const pb = Math.abs(p - b);
    const pc = Math.abs(p - c);
    return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
  };

  for (let y = 0; y < height; y += 1) {
    const filter = raw[rawOffset++];
    for (let x = 0; x < stride; x += 1) {
      const value = raw[rawOffset++];
      const left = x >= 4 ? current[x - 4]! : 0;
      const up = previous[x]!;
      const upperLeft = x >= 4 ? previous[x - 4]! : 0;
      current[x] = filter === 0 ? value
        : filter === 1 ? (value + left) & 0xff
          : filter === 2 ? (value + up) & 0xff
            : filter === 3 ? (value + Math.floor((left + up) / 2)) & 0xff
              : filter === 4 ? (value + paeth(left, up, upperLeft)) & 0xff
                : (() => { throw new Error(`Unsupported PNG filter ${filter}`); })();
    }
    for (let x = 0; x < stride; x += 4) {
      const alpha = current[x + 3]!;
      if (alpha < 32) continue;
      visible += 1;
      const lum = Math.round(current[x]! * 0.2126 + current[x + 1]! * 0.7152 + current[x + 2]! * 0.0722);
      minLum = Math.min(minLum, lum);
      maxLum = Math.max(maxLum, lum);
    }
    current.copy(previous);
  }

  return {
    visibleRatio: visible / (width * height),
    luminanceRange: maxLum - minLum,
  };
}

describe("Chrome Web Store readiness", () => {
  it("ships required icon sizes that are visibly nonblank", () => {
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
      const stats = rgbaPngContrast(`extension/icons/icon-${size}.png`);
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
