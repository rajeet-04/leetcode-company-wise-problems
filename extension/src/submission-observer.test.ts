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

  it("emits terminal outcomes only for judge ids started by Submit, never Run Code", async () => {
    const module = await import("./submission-observer");
    const createTracker = (module as typeof module & {
      createSubmissionResponseTracker?: () => {
        inspect: (url: string, payload: unknown) => ReturnType<typeof classifySubmissionPayload>;
      };
    }).createSubmissionResponseTracker;

    expect(createTracker).toBeTypeOf("function");
    const tracker = createTracker!();

    expect(tracker.inspect(
      "https://leetcode.com/problems/two-sum/interpret_solution/",
      { interpret_id: 7001 },
    )).toBeNull();
    expect(tracker.inspect(
      "https://leetcode.com/submissions/detail/7001/check/",
      { status_msg: "Accepted", submission_id: 7001, runtime: "1 ms" },
    )).toBeNull();

    expect(tracker.inspect(
      "https://leetcode.com/problems/two-sum/submit/",
      { submission_id: 8001 },
    )).toBeNull();
    expect(tracker.inspect(
      "https://leetcode.com/submissions/detail/8001/check/",
      { status_msg: "Accepted", submission_id: 8001, runtime: "2 ms" },
    )).toEqual({ kind: "accepted", reason: "Accepted" });
  });
});
