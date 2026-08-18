import { describe, expect, it } from "vitest";
import type { CatalogProblem } from "@leet-progress/types";
import { createCatalogIndex, lookupCatalogProblem } from "./catalog-index";

const problem: CatalogProblem = { slug: "two-sum", title: "Two Sum", url: "https://leetcode.com/problems/two-sum/", difficulty: "EASY", topics: ["Array"], observations: [{ company: "Google", window: "30d", frequency: 80, acceptanceRate: 50 }] };

describe("catalog index", () => {
  it("resolves slugs case-insensitively", () => {
    const index = createCatalogIndex([problem]);
    expect(lookupCatalogProblem(index, "TWO-SUM")?.title).toBe("Two Sum");
  });
});
