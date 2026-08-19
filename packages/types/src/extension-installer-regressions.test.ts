import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (file: string) => fs.readFileSync(path.join(root, file), "utf8");

describe("extension installer experience", () => {
  it("provides a dedicated visual install guide backed by GitHub releases", () => {
    const page = read("frontend/app/extension/page.tsx");
    expect(page).toContain('const REPO = "https://github.com/rajeet-04/leetcode-company-wise-problems"');
    expect(page).toContain("releases/latest/download/leet-progress-chromium.zip");
    expect(page).toContain("edge://extensions");
    expect(page).toContain("Load unpacked");
    expect(page).toContain("/extension-guide/edge-developer-mode.jpg");
    expect(page).toContain("/extension-guide/edge-extension-loaded.jpg");
    expect(fs.existsSync(path.join(root, "frontend/public/extension-guide/edge-developer-mode.jpg"))).toBe(true);
    expect(fs.existsSync(path.join(root, "frontend/public/extension-guide/edge-extension-loaded.jpg"))).toBe(true);
  });

  it("turns missing-extension sync state into a setup entry point", () => {
    const shell = read("frontend/app/app-shell.tsx");
    const guide = read("frontend/app/extension-import-guide.tsx");
    expect(shell).toContain('href="/extension"');
    expect(shell).toContain("Set up extension");
    expect(guide).toContain('href="/extension"');
    expect(guide).toContain("Install / set up extension");
    expect(guide).toContain("syncs automatically");
  });

  it("publishes versioned extension ZIPs as the latest GitHub release", () => {
    const workflow = read(".github/workflows/extension-release.yml");
    expect(workflow).toContain("contents: write");
    expect(workflow).toContain("leet-progress-chromium.zip");
    expect(workflow).toContain("leet-progress-firefox.zip");
    expect(workflow).toContain("gh release create");
    expect(workflow).toContain("--latest");
  });

  it("keeps canonical GitHub setup documentation", () => {
    const doc = read("docs/EXTENSION_INSTALL.md");
    expect(doc).toContain("edge://extensions");
    expect(doc).toContain("Load unpacked");
    expect(doc).toContain("https://github.com/rajeet-04/leetcode-company-wise-problems/releases/latest");
    expect(doc).toContain("https://leetcode.com/progress/");
  });
});
