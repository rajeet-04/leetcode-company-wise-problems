import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("legacy importer removal", () => {
  it("does not ship the executable console connector", () => {
    expect(fs.existsSync(path.join(root, "frontend/public/leetcode-connector.js"))).toBe(false);
  });

  it("does not instruct users to paste a launcher into DevTools", () => {
    const files = [
      "frontend/app/import-guide.tsx",
      "frontend/app/extension-import-guide.tsx",
      "frontend/app/explore-client.tsx",
    ];
    const text = files.map((file) => fs.readFileSync(path.join(root, file), "utf8")).join("\n");
    for (const forbidden of ["Press F12", "Open Console", "Copy launcher", "leetcode-connector.js"]) {
      expect(text).not.toContain(forbidden);
    }
  });
});
