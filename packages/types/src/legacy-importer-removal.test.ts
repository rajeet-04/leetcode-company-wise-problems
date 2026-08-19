import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("legacy importer boundary", () => {
  it("does not ship the old executable console connector asset", () => {
    expect(fs.existsSync(path.join(root, "frontend/public/leetcode-connector.js"))).toBe(false);
  });

  it("keeps the no-extension fallback self-contained instead of reviving the old launcher asset", () => {
    const files = [
      "frontend/app/import-guide.tsx",
      "frontend/app/extension-import-guide.tsx",
      "frontend/app/explore-client.tsx",
    ];
    const text = files.map((file) => fs.readFileSync(path.join(root, file), "utf8")).join("\n");
    expect(text).not.toContain("leetcode-connector.js");
    expect(text).not.toContain("/leetcode-connector.js");
  });
});
