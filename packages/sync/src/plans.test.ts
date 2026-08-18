import { describe, expect, it } from "vitest";
import type { InterviewPlan } from "@leet-progress/plans";
import { deriveInterviewPlans, mergeMutations, validateMutation, type ProgressMutation } from "./index";

const plan: InterviewPlan = { id: "p1", name: "Google", targetCompanies: ["Google"], dailyProblemGoal: 3, difficultyPreference: "balanced", excludedTopics: [], pinnedSlugs: [], deferredSlugs: [], createdAt: "2026-08-18T00:00:00.000Z", updatedAt: "2026-08-18T00:00:00.000Z" };
const upsert = (updatedAt = "2026-08-18T00:00:00.000Z"): ProgressMutation => ({ protocolVersion:1,schemaVersion:1,mutationId:`upsert:${updatedAt}`,installationId:"web",source:"web",type:"PLAN_UPSERT",occurredAt:updatedAt,payload:{plan:{...plan,updatedAt}} } as ProgressMutation);

describe("plan sync", () => {
  it("derives latest upserts and honors delete tombstones", () => {
    expect(validateMutation(upsert())).toBe(true);
    expect(deriveInterviewPlans([upsert()])).toHaveLength(1);
    const deletion = { protocolVersion:1,schemaVersion:1,mutationId:"delete",installationId:"web",source:"web",type:"PLAN_DELETE",occurredAt:"2026-08-19T00:00:00.000Z",payload:{planId:"p1"} } as ProgressMutation;
    expect(deriveInterviewPlans(mergeMutations([upsert()], [deletion]))).toEqual([]);
  });
});
