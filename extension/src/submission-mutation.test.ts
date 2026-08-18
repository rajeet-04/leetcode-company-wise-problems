import { describe, expect, it } from "vitest";
import { createSubmissionMutation } from "./submission-mutation";

describe("submission progress mutations", () => {
  it("maps accepted to a deterministic solved mutation", () => {
    const mutation = createSubmissionMutation({ slug: "two-sum", outcome: { kind: "accepted", reason: "Accepted" }, fingerprint: "submission:123", installationId: "ext-1", at: "2026-08-18T10:00:00.000Z" });
    expect(mutation.type).toBe("PROBLEM_SOLVED");
    expect(mutation.mutationId).toBe("extension:submission:submission:123:solved");
  });
  it("maps failures to attempted with the same id for duplicate delivery", () => {
    const input = { slug: "two-sum", outcome: { kind: "failed" as const, reason: "Wrong Answer" }, fingerprint: "submission:124", installationId: "ext-1", at: "2026-08-18T10:01:00.000Z" };
    expect(createSubmissionMutation(input)).toEqual(createSubmissionMutation(input));
    expect(createSubmissionMutation(input).type).toBe("PROBLEM_ATTEMPTED");
  });
});
