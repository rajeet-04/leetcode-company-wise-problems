import { describe, expect, it } from "vitest";
import { deriveTargetCompanies, mergeMutations, validateMutation, type ProgressMutation } from "./index";

const targetMutation = (id: string, at: string, targets: string[]): ProgressMutation => ({
  protocolVersion: 1, schemaVersion: 1, mutationId: id, installationId: "web-1", source: "web", type: "TARGETS_SET", occurredAt: at, payload: { targetCompanies: targets },
} as ProgressMutation);

describe("target-company sync", () => {
  it("accepts target mutations and derives the latest normalized set", () => {
    const old = targetMutation("a", "2026-08-18T10:00:00.000Z", ["Google"]);
    const latest = targetMutation("b", "2026-08-18T11:00:00.000Z", ["Meta", "Google", "Meta"]);
    expect(validateMutation(latest)).toBe(true);
    expect(deriveTargetCompanies(mergeMutations([latest], [old]))).toEqual(["Google", "Meta"]);
  });
});
