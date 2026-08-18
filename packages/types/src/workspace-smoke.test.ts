import { describe, expect, it } from "vitest";
import { ANALYTICS_PACKAGE_VERSION } from "@leet-progress/analytics";
import { CATALOG_PACKAGE_VERSION } from "@leet-progress/catalog";
import { INTELLIGENCE_PACKAGE_VERSION } from "@leet-progress/intelligence";
import { PROGRESS_PACKAGE_VERSION } from "@leet-progress/progress";
import { RECOMMENDATIONS_PACKAGE_VERSION } from "@leet-progress/recommendations";
import { STORAGE_PACKAGE_VERSION } from "@leet-progress/storage";

describe("workspace package boundaries", () => {
  it("resolves every shared package by workspace name", () => {
    expect(CATALOG_PACKAGE_VERSION).toBe(1);
    expect(INTELLIGENCE_PACKAGE_VERSION).toBe(1);
    expect(PROGRESS_PACKAGE_VERSION).toBe(1);
    expect(RECOMMENDATIONS_PACKAGE_VERSION).toBe(1);
    expect(ANALYTICS_PACKAGE_VERSION).toBe(1);
    expect(STORAGE_PACKAGE_VERSION).toBe(1);
  });
});
