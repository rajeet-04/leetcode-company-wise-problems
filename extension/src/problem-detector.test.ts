import { describe, expect, it } from "vitest";
import { extractProblemSlug } from "./problem-detector";

describe("extractProblemSlug", () => {
  it("extracts a normal problem slug", () => expect(extractProblemSlug("/problems/two-sum/description/")).toBe("two-sum"));
  it("normalizes case", () => expect(extractProblemSlug("/problems/Number-Of-Islands/" )).toBe("number-of-islands"));
  it("returns null outside problem routes", () => expect(extractProblemSlug("/problemset/")).toBeNull());
});
