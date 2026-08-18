import { describe, expect, it } from "vitest";
import { filterProblems, type Filters, type SearchableProblem } from "./search";

const items: SearchableProblem[] = [
  { title: "Two Sum", slug: "two-sum", difficulty: "EASY", companies: ["Google", "Amazon"], periods: ["30d"], topics: ["Array", "Hash Table"] },
  { title: "3Sum", slug: "3sum", difficulty: "MEDIUM", companies: ["Google"], periods: ["90d"], topics: ["Array", "Two Pointers"] },
  { title: "Trapping Rain Water", slug: "trapping-rain-water", difficulty: "HARD", companies: ["Meta"], periods: ["6m"], topics: ["Stack"] },
];

const base: Filters = { query: "", companies: [], difficulties: [], periods: [], solved: "all", sort: "relevance" };

describe("filterProblems", () => {
  it("supports ANY and ALL company matching", () => {
    expect(filterProblems(items, { ...base, companies: ["Google", "Amazon"] }, new Set()).map((p) => p.slug)).toEqual(["3sum", "two-sum"]);
    expect(filterProblems(items, { ...base, companies: ["Google", "Amazon"], companyMatch: "all" }, new Set()).map((p) => p.slug)).toEqual(["two-sum"]);
  });

  it("filters difficulty, period and solved state", () => {
    expect(filterProblems(items, { ...base, difficulties: ["EASY"], periods: ["30d"], solved: "solved" }, new Set(["two-sum"])).map((p) => p.slug)).toEqual(["two-sum"]);
  });

  it("ranks exact title above topic/company matches for relevance", () => {
    expect(filterProblems(items, { ...base, query: "two sum" }, new Set()).map((p) => p.slug)).toEqual(["two-sum"]);
    expect(filterProblems(items, { ...base, query: "array" }, new Set()).map((p) => p.slug)).toEqual(["3sum", "two-sum"]);
  });

  it("sorts difficulty semantically EASY, MEDIUM, HARD", () => {
    expect(filterProblems(items, { ...base, sort: "difficulty" }, new Set()).map((p) => p.difficulty)).toEqual(["EASY", "MEDIUM", "HARD"]);
  });
});
