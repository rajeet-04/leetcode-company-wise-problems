import { describe, expect, it } from "vitest";
import { normalizeRow } from "./normalize";

const base = {
  Difficulty: "medium",
  Title: "Two Sum",
  Frequency: "42.5",
  "Acceptance Rate": "0.52",
  Link: "https://leetcode.com/problems/Two-Sum/?envType=company",
  Topics: "Array, Hash Table, Array",
};

describe("normalizeRow", () => {
  it.each([
    ["1. Thirty Days.csv", "30d"],
    ["2. Three Months.csv", "90d"],
    ["3. Six Months.csv", "6m"],
    ["4. More Than Six Months.csv", "older"],
    ["5. All.csv", "all"],
  ] as const)("maps %s to %s", (filename, window) => {
    expect(normalizeRow("Google", filename, base)?.observation.window).toBe(window);
  });

  it("normalizes identity, numbers, topics, and difficulty", () => {
    expect(normalizeRow(" Google ", "1. Thirty Days.csv", base)).toEqual({
      slug: "two-sum",
      title: "Two Sum",
      url: base.Link,
      difficulty: "MEDIUM",
      topics: ["Array", "Hash Table"],
      observation: {
        company: "Google",
        window: "30d",
        frequency: 42.5,
        acceptanceRate: 0.52,
      },
    });
  });

  it("uses null for missing or non-finite numeric values", () => {
    const result = normalizeRow("Google", "5. All.csv", {
      ...base,
      Frequency: "",
      "Acceptance Rate": "not-a-number",
    });
    expect(result?.observation.frequency).toBeNull();
    expect(result?.observation.acceptanceRate).toBeNull();
  });

  it("rejects rows without a real LeetCode identity", () => {
    expect(normalizeRow("Google", "5. All.csv", { ...base, Link: "" })).toBeNull();
    expect(normalizeRow("Google", "5. All.csv", { ...base, Title: "" })).toBeNull();
    expect(normalizeRow("Google", "5. All.csv", { ...base, Link: "https://leetcode.com/contest/" })).toBeNull();
  });
});
