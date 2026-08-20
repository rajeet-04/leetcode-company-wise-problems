import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (file: string) => fs.readFileSync(path.join(root, file), "utf8");

describe("application shell regressions", () => {
  it("keeps Explore inside the single global header", () => {
    const explore = read("frontend/app/explore-client.tsx");
    const shell = read("frontend/app/app-shell.tsx");

    expect(explore).not.toContain("<header");
    expect(explore).not.toContain("ThemeToggle");
    expect(shell).toContain("Import from LeetCode");
  });

  it("themes the actual shell and sticky header with semantic theme classes", () => {
    const shell = read("frontend/app/app-shell.tsx");
    const css = read("frontend/app/globals.css");

    expect(shell).toContain("app-shell");
    expect(shell).toContain("app-shell-header");
    expect(css).toMatch(/\.app-shell\s*\{[^}]*background:/s);
    expect(css).toMatch(/\.app-shell-header\s*\{[^}]*backdrop-filter:/s);
  });

  it("keeps common translucent text and surface utilities readable in dark mode", () => {
    const css = read("frontend/app/globals.css");

    expect(css).toContain(".dark .text-black\\/50");
    expect(css).toContain(".dark .bg-black\\/\\[\\.02\\]");
    expect(css).toContain(".dark .bg-black\\/\\[\\.025\\]");
    expect(css).toContain(".dark .bg-black\\/\\[\\.06\\]");
    expect(css).toContain(".dark .divide-black\\/\\[\\.06\\]");
  });

  it("defines accessible selection, liquid glass, and reduced-motion-safe interaction feedback", () => {
    const css = read("frontend/app/globals.css");

    expect(css).toMatch(/::selection\s*\{[^}]*background:/s);
    expect(css).toMatch(/\.dark ::selection\s*\{[^}]*color:/s);
    expect(css).toContain("--glass-surface");
    expect(css).toContain("--glass-highlight");
    expect(css).toContain("@keyframes page-materialize");
    expect(css).toContain("prefers-reduced-motion: reduce");
    expect(css).toMatch(/button:active[^}]*transform:/s);
    expect(css).toMatch(/a\[href\][^}]*transition:/s);
  });

  it("offers LeetCode import with and without the extension", () => {
    const guide = read("frontend/app/extension-import-guide.tsx");

    expect(guide).toContain("With extension");
    expect(guide).toContain("Without extension");
    expect(guide).toContain("Copy one-time import script");
    expect(guide).toContain("LEET_PROGRESS_FALLBACK_RESULT");
  });
});
