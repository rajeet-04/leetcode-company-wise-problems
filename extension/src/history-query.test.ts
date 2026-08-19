import { describe, expect, it } from "vitest";
import { fetchSolvedHistorySlugs } from "./history-query";

describe("fetchSolvedHistorySlugs", () => {
  it("paginates LeetCode progress results and keeps only unique solved slugs", async () => {
    const skips: number[] = [];
    const mockFetch: typeof fetch = async (_input, init) => {
      const body = JSON.parse(String(init?.body)) as { variables: { filters: { skip: number; limit: number } } };
      skips.push(body.variables.filters.skip);
      const questions = body.variables.filters.skip === 0
        ? [
            { frontendId: "1", titleSlug: "two-sum", questionStatus: "SOLVED" },
            { frontendId: "2", titleSlug: "add-two-numbers", questionStatus: "ATTEMPTED" },
          ]
        : [
            { frontendId: "3", titleSlug: "valid-parentheses", questionStatus: "SOLVED" },
            { frontendId: "1", titleSlug: "two-sum", questionStatus: "SOLVED" },
          ];
      return new Response(JSON.stringify({ data: { userProgressQuestionList: { totalNum: 52, questions } } }), { status: 200 });
    };

    await expect(fetchSolvedHistorySlugs(mockFetch)).resolves.toEqual(["two-sum", "valid-parentheses"]);
    expect(skips).toEqual([0, 50]);
  });

  it("fails closed when LeetCode changes the response schema", async () => {
    const mockFetch: typeof fetch = async () => new Response(JSON.stringify({ data: { userProgressQuestionList: null } }), { status: 200 });
    await expect(fetchSolvedHistorySlugs(mockFetch)).rejects.toThrow("leetcode-history-schema-changed");
  });
});
