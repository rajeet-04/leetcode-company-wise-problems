import { describe, expect, it } from "vitest";
import { aggregateCatalog } from "./aggregate";
import type { NormalizedCatalogRow } from "./normalize";

const google30: NormalizedCatalogRow = {
  slug: "two-sum",
  title: "Two Sum",
  url: "https://leetcode.com/problems/two-sum/",
  difficulty: "EASY",
  topics: ["Array", "Hash Table"],
  observation: {
    company: "Google",
    window: "30d",
    frequency: 100,
    acceptanceRate: 0.52,
  },
};

const amazon90: NormalizedCatalogRow = {
  ...google30,
  topics: ["Hash Table"],
  observation: {
    company: "Amazon",
    window: "90d",
    frequency: 72.5,
    acceptanceRate: 0.52,
  },
};

const google6m: NormalizedCatalogRow = {
  ...google30,
  observation: {
    company: "Google",
    window: "6m",
    frequency: 50,
    acceptanceRate: 0.52,
  },
};

describe("aggregateCatalog", () => {
  it("retains every distinct observation while merging one problem", () => {
    const result = aggregateCatalog([google30, amazon90, google6m]);
    expect(result).toHaveLength(1);
    expect(result[0]?.topics).toEqual(["Array", "Hash Table"]);
    expect(result[0]?.observations).toEqual([
      amazon90.observation,
      google30.observation,
      google6m.observation,
    ]);
  });

  it("deduplicates exact duplicate observations", () => {
    const result = aggregateCatalog([google30, google30]);
    expect(result[0]?.observations).toHaveLength(1);
  });

  it("is deterministic regardless of input order", () => {
    const forward = JSON.stringify(aggregateCatalog([google30, amazon90, google6m]));
    const reverse = JSON.stringify(aggregateCatalog([google6m, amazon90, google30]));
    expect(forward).toBe(reverse);
  });
});
