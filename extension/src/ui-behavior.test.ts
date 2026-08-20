import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = (name: string) => readFileSync(path.resolve(import.meta.dirname, name), "utf8");
const sidepanel = source("sidepanel.ts");
const popup = source("popup.ts");
const uiCss = readFileSync(path.resolve(import.meta.dirname, "../ui.css"), "utf8");
const contentCss = readFileSync(path.resolve(import.meta.dirname, "../content.css"), "utf8");
const catalogRefresh = source("catalog-refresh.ts");

describe("extension UI behavior", () => {
  it("renders recommendation rows as LeetCode links", () => {
    expect(sidepanel).toContain('document.createElement("a")');
    expect(sidepanel).toContain('https://leetcode.com/problems/${encodeURIComponent(recommendation.slug)}/');
    expect(sidepanel).toContain('item.target="_blank"');
  });

  it("offers an Open Leet Progress link from popup and side panel", () => {
    for (const file of [popup, sidepanel]) {
      expect(file).toContain('https://leet.rajeet.in/');
      expect(file).toContain('Open Leet Progress ↗');
    }
  });

  it("supports system dark mode in extension-owned UI surfaces", () => {
    expect(uiCss.replaceAll(" ", "")).toContain("@media(prefers-color-scheme:dark)");
    expect(uiCss).toContain("--bg:");
    expect(contentCss.replaceAll(" ", "")).toContain("@media(prefers-color-scheme:dark)");
  });

  it("keeps OTA catalog refresh pinned to the production website", () => {
    expect(catalogRefresh).toContain('PUBLIC_CATALOG_BASE = "https://leet.rajeet.in/catalog"');
  });
});
