import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { buildCatalogArtifacts } from "./build";

const tempRoots: string[] = [];

function makeFixtureRoot(): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "leet-catalog-"));
  tempRoots.push(root);
  fs.mkdirSync(path.join(root, "Google"));
  fs.mkdirSync(path.join(root, "Amazon"));
  fs.writeFileSync(
    path.join(root, "Google", "1. Thirty Days.csv"),
    [
      "Difficulty,Title,Frequency,Acceptance Rate,Link,Topics",
      'EASY,Two Sum,100,0.52,https://leetcode.com/problems/two-sum/,"Array, Hash Table"',
    ].join("\n"),
  );
  fs.writeFileSync(
    path.join(root, "Amazon", "2. Three Months.csv"),
    [
      "Difficulty,Title,Frequency,Acceptance Rate,Link,Topics",
      'EASY,Two Sum,75,0.52,https://leetcode.com/problems/two-sum/,"Hash Table"',
    ].join("\n"),
  );
  return root;
}

afterEach(() => {
  for (const root of tempRoots.splice(0)) fs.rmSync(root, { recursive: true, force: true });
});

describe("buildCatalogArtifacts", () => {
  it("writes canonical, compatibility, metadata, and extension artifacts", () => {
    const root = makeFixtureRoot();
    const webDataDir = path.join(root, "generated-web");
    const extensionArtifactPath = path.join(root, "generated-extension", "catalog.json");

    const result = buildCatalogArtifacts({
      rootDir: root,
      webDataDir,
      extensionArtifactPath,
      generatedAt: "2026-08-18T00:00:00.000Z",
    });

    expect(result.metadata).toMatchObject({
      schemaVersion: 2,
      generatedAt: "2026-08-18T00:00:00.000Z",
      sourceRows: 2,
      uniqueProblems: 1,
      companies: 2,
      mergedDuplicates: 1,
    });
    expect(result.metadata.checksum).toMatch(/^[a-f0-9]{64}$/);
    expect(result.problems[0]?.observations).toHaveLength(2);
    expect(fs.existsSync(path.join(webDataDir, "catalog-v2.json"))).toBe(true);
    expect(fs.existsSync(path.join(webDataDir, "catalog.json"))).toBe(true);
    expect(fs.existsSync(path.join(webDataDir, "catalog-meta.json"))).toBe(true);
    expect(fs.existsSync(extensionArtifactPath)).toBe(true);
  });

  it("generates deterministic canonical output for unchanged source input", () => {
    const root = makeFixtureRoot();
    const firstDir = path.join(root, "out-one");
    const secondDir = path.join(root, "out-two");
    buildCatalogArtifacts({
      rootDir: root,
      webDataDir: firstDir,
      extensionArtifactPath: path.join(root, "ext-one.json"),
      generatedAt: "2026-08-18T00:00:00.000Z",
    });
    buildCatalogArtifacts({
      rootDir: root,
      webDataDir: secondDir,
      extensionArtifactPath: path.join(root, "ext-two.json"),
      generatedAt: "2026-08-19T00:00:00.000Z",
    });

    expect(fs.readFileSync(path.join(firstDir, "catalog-v2.json"), "utf8")).toBe(
      fs.readFileSync(path.join(secondDir, "catalog-v2.json"), "utf8"),
    );
  });

  it("fails instead of inventing identity for malformed rows", () => {
    const root = makeFixtureRoot();
    fs.writeFileSync(
      path.join(root, "Google", "5. All.csv"),
      "Difficulty,Title,Frequency,Acceptance Rate,Link,Topics\nEASY,Broken,1,0.5,,Array",
    );
    expect(() =>
      buildCatalogArtifacts({
        rootDir: root,
        webDataDir: path.join(root, "web"),
        extensionArtifactPath: path.join(root, "extension.json"),
      }),
    ).toThrow(/invalid problem identity/);
  });
});
