import { describe, expect, it } from "vitest";
import { isAllowedWebsiteUrl } from "./website-bridge-policy";

describe("website sync origin policy", () => {
  it("allows the exact deployed Leet Progress origin", () => expect(isAllowedWebsiteUrl("https://leet.rajeet.in/explore")).toBe(true));
  it("rejects deceptive and unrelated origins", () => {
    expect(isAllowedWebsiteUrl("https://leet.rajeet.in.evil.example/")).toBe(false);
    expect(isAllowedWebsiteUrl("https://evil.example/?next=https://leet.rajeet.in")).toBe(false);
  });
});
