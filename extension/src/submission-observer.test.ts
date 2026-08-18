import { describe, expect, it } from "vitest";
import { classifySubmissionPayload, submissionFingerprint } from "./submission-observer";

describe("LeetCode submission adapter", () => {
  it("classifies Accepted as terminal success", () => expect(classifySubmissionPayload({ status_msg: "Accepted", submission_id: 123 })).toEqual({ kind: "accepted", reason: "Accepted" }));
  it("classifies terminal failures", () => expect(classifySubmissionPayload({ status_msg: "Wrong Answer", submission_id: 124 })).toEqual({ kind: "failed", reason: "Wrong Answer" }));
  it("ignores non-terminal judging states", () => {
    expect(classifySubmissionPayload({ state: "STARTED", status_msg: "Pending" })).toBeNull();
    expect(classifySubmissionPayload({ status_msg: "Judging" })).toBeNull();
  });
  it("creates a stable fingerprint from submission identity", () => {
    const payload = { status_msg: "Accepted", submission_id: 123, runtime: "1 ms" };
    expect(submissionFingerprint(payload)).toBe(submissionFingerprint({ ...payload }));
    expect(submissionFingerprint(payload)).toContain("123");
  });
});
