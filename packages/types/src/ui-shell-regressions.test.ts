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
    expect(css).toMatch(/\.app-shell\s*\{[^}]*background:\s*var\(--canvas\)/s);
    expect(css).toMatch(/\.app-shell-header\s*\{[^}]*background:/s);
  });

  it("offers LeetCode import with and without the extension", () => {
    const guide = read("frontend/app/extension-import-guide.tsx");

    expect(guide).toContain("With extension");
    expect(guide).toContain("Without extension");
    expect(guide).toContain("Copy one-time import script");
    expect(guide).toContain("LEET_PROGRESS_FALLBACK_RESULT");
  });
});
