import { readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import manifest from "../manifest.json";

describe("extension hardening",()=>{
  it("keeps the permission surface narrow",()=>{
    expect([...manifest.permissions].sort()).toEqual(["alarms","scripting","sidePanel","storage"]);
    expect([...manifest.host_permissions].sort()).toEqual(["https://leet-progress-eta.vercel.app/*","https://leetcode.com/*"]);
    expect(JSON.stringify(manifest)).not.toContain("storage.sync");
  });
  it("does not poll the side panel on an interval",()=>{
    const source=readFileSync(path.resolve(import.meta.dirname,"sidepanel.ts"),"utf8");
    expect(source).not.toContain("setInterval");
  });
  it("keeps the packaged catalog below the release budget",()=>{
    const bytes=statSync(path.resolve(import.meta.dirname,"../../artifacts/catalog/extension-catalog.json")).size;
    expect(bytes).toBeLessThan(8*1024*1024);
  });
});
