import type { InterviewPlan } from "@leet-progress/plans";
import { reduceProgress, type ProblemProgress, type ProgressStatus } from "@leet-progress/progress";

export const SYNC_PROTOCOL_VERSION = 1 as const;
export const SYNC_SCHEMA_VERSION = 1 as const;
export type SyncSource = "web" | "extension";

export type MutationEnvelope<TType extends string, TPayload> = {
  protocolVersion: typeof SYNC_PROTOCOL_VERSION;
  schemaVersion: typeof SYNC_SCHEMA_VERSION;
  mutationId: string;
  installationId: string;
  source: SyncSource;
  type: TType;
  occurredAt: string;
  payload: TPayload;
};

export type ProgressMutation =
  | MutationEnvelope<"PROBLEM_ATTEMPTED", { slug: string }>
  | MutationEnvelope<"PROBLEM_SOLVED", { slug: string }>
  | MutationEnvelope<"PROBLEM_STATUS_SET", { slug: string; status: ProgressStatus }>
  | MutationEnvelope<"PROBLEM_STATE_SET", { progress: ProblemProgress }>
  | MutationEnvelope<"CONFIDENCE_SET", { slug: string; confidence: 1 | 2 | 3 | 4 | 5 }>
  | MutationEnvelope<"NOTE_SET", { slug: string; note: string }>
  | MutationEnvelope<"REVISION_DUE", { slug: string; dueAt: string }>
  | MutationEnvelope<"REVISION_COMPLETED", { slug: string; nextDueAt: string }>
  | MutationEnvelope<"PROBLEM_MASTERED", { slug: string }>
  | MutationEnvelope<"TARGETS_SET", { targetCompanies: string[] }>
  | MutationEnvelope<"PLAN_UPSERT", { plan: InterviewPlan }>
  | MutationEnvelope<"PLAN_DELETE", { planId: string }>;

export type SyncHello = { protocolVersion: typeof SYNC_PROTOCOL_VERSION; client: SyncSource; installationId: string; schemaVersions: { progress: 1 }; knownMutationIds: string[] };
export type SyncExchange = { protocolVersion: typeof SYNC_PROTOCOL_VERSION; client: SyncSource; installationId: string; knownMutationIds: string[]; mutations: ProgressMutation[] };

function isRecord(value: unknown): value is Record<string, unknown> { return !!value && typeof value === "object" && !Array.isArray(value); }
function validBase(value: Record<string, unknown>): boolean {
  return value.protocolVersion === 1 && value.schemaVersion === 1 && typeof value.mutationId === "string" && value.mutationId.length > 0 && typeof value.installationId === "string" && value.installationId.length > 0 && (value.source === "web" || value.source === "extension") && typeof value.occurredAt === "string" && !Number.isNaN(Date.parse(value.occurredAt)) && typeof value.type === "string" && isRecord(value.payload);
}
function validSlug(value: unknown): value is string { return typeof value === "string" && value.trim().length > 0; }
function validStringArray(value: unknown): value is string[] { return Array.isArray(value) && value.every((item) => typeof item === "string"); }
function validProgress(value: unknown): value is ProblemProgress {
  if (!isRecord(value)) return false;
  return validSlug(value.slug) && ["unseen","attempted","solved","revision_due","mastered"].includes(String(value.status)) && typeof value.attempts === "number" && value.attempts >= 0 && typeof value.revisitCount === "number" && value.revisitCount >= 0;
}
function validPlan(value: unknown): value is InterviewPlan {
  if (!isRecord(value)) return false;
  return typeof value.id === "string" && value.id.length > 0 && typeof value.name === "string" && value.name.length > 0 && validStringArray(value.targetCompanies) && typeof value.dailyProblemGoal === "number" && value.dailyProblemGoal > 0 && ["balanced","easy-medium","medium-hard"].includes(String(value.difficultyPreference)) && validStringArray(value.excludedTopics) && validStringArray(value.pinnedSlugs) && validStringArray(value.deferredSlugs) && typeof value.createdAt === "string" && typeof value.updatedAt === "string" && !Number.isNaN(Date.parse(value.createdAt)) && !Number.isNaN(Date.parse(value.updatedAt));
}
function normalizeTargets(values: readonly string[]): string[] { return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b)); }

export function validateMutation(value: unknown): value is ProgressMutation {
  if (!isRecord(value) || !validBase(value)) return false;
  const payload=value.payload as Record<string,unknown>;
  switch(value.type){
    case "PROBLEM_ATTEMPTED": case "PROBLEM_SOLVED": case "PROBLEM_MASTERED": return validSlug(payload.slug);
    case "PROBLEM_STATUS_SET": return validSlug(payload.slug)&&["unseen","attempted","solved","revision_due","mastered"].includes(String(payload.status));
    case "PROBLEM_STATE_SET": return validProgress(payload.progress);
    case "CONFIDENCE_SET": return validSlug(payload.slug)&&[1,2,3,4,5].includes(Number(payload.confidence));
    case "NOTE_SET": return validSlug(payload.slug)&&typeof payload.note==="string";
    case "REVISION_DUE": return validSlug(payload.slug)&&typeof payload.dueAt==="string"&&!Number.isNaN(Date.parse(payload.dueAt));
    case "REVISION_COMPLETED": return validSlug(payload.slug)&&typeof payload.nextDueAt==="string"&&!Number.isNaN(Date.parse(payload.nextDueAt));
    case "TARGETS_SET": return Array.isArray(payload.targetCompanies)&&payload.targetCompanies.every((company)=>typeof company==="string"&&company.trim().length>0);
    case "PLAN_UPSERT": return validPlan(payload.plan);
    case "PLAN_DELETE": return typeof payload.planId==="string"&&payload.planId.length>0;
    default:return false;
  }
}

export function compareMutations(a:ProgressMutation,b:ProgressMutation){return a.occurredAt.localeCompare(b.occurredAt)||a.mutationId.localeCompare(b.mutationId);}
export function mergeMutations(current:readonly ProgressMutation[],incoming:readonly ProgressMutation[]):ProgressMutation[]{const byId=new Map<string,ProgressMutation>();for(const mutation of [...current,...incoming])if(validateMutation(mutation)&&!byId.has(mutation.mutationId))byId.set(mutation.mutationId,mutation);return [...byId.values()].sort(compareMutations);}

export function applyProgressMutations(existing:readonly ProblemProgress[],mutations:readonly ProgressMutation[]):ProblemProgress[]{
  const bySlug=new Map(existing.map((progress)=>[progress.slug,{...progress}]));
  for(const mutation of mergeMutations([],mutations)){
    if(mutation.type==="TARGETS_SET"||mutation.type==="PLAN_UPSERT"||mutation.type==="PLAN_DELETE")continue;
    if(mutation.type==="PROBLEM_STATE_SET"){bySlug.set(mutation.payload.progress.slug,{...mutation.payload.progress});continue;}
    const slug=mutation.payload.slug;const current=bySlug.get(slug);
    switch(mutation.type){
      case "PROBLEM_ATTEMPTED":bySlug.set(slug,reduceProgress(current,{type:"ATTEMPT",slug,at:mutation.occurredAt}));break;
      case "PROBLEM_SOLVED":bySlug.set(slug,reduceProgress(current,{type:"SOLVE",slug,at:mutation.occurredAt}));break;
      case "PROBLEM_STATUS_SET":bySlug.set(slug,reduceProgress(current,{type:"SET_STATUS",slug,at:mutation.occurredAt,status:mutation.payload.status}));break;
      case "CONFIDENCE_SET":bySlug.set(slug,reduceProgress(current,{type:"SET_CONFIDENCE",slug,at:mutation.occurredAt,confidence:mutation.payload.confidence}));break;
      case "NOTE_SET":bySlug.set(slug,reduceProgress(current,{type:"SET_NOTE",slug,at:mutation.occurredAt,note:mutation.payload.note}));break;
      case "REVISION_DUE":bySlug.set(slug,reduceProgress(current,{type:"REVISION_DUE",slug,at:mutation.occurredAt,dueAt:mutation.payload.dueAt}));break;
      case "REVISION_COMPLETED":bySlug.set(slug,reduceProgress(current,{type:"REVISION_COMPLETE",slug,at:mutation.occurredAt,nextDueAt:mutation.payload.nextDueAt}));break;
      case "PROBLEM_MASTERED":bySlug.set(slug,reduceProgress(current,{type:"MASTER",slug,at:mutation.occurredAt}));break;
    }
  }
  return [...bySlug.values()].sort((a,b)=>a.slug.localeCompare(b.slug));
}

export function deriveTargetCompanies(mutations:readonly ProgressMutation[],fallback:readonly string[]=[]):string[]{const latest=mergeMutations([],mutations).filter((m):m is Extract<ProgressMutation,{type:"TARGETS_SET"}>=>m.type==="TARGETS_SET").at(-1);return normalizeTargets(latest?.payload.targetCompanies??fallback);}
export function deriveInterviewPlans(mutations:readonly ProgressMutation[]):InterviewPlan[]{const plans=new Map<string,InterviewPlan>();for(const mutation of mergeMutations([],mutations)){if(mutation.type==="PLAN_UPSERT")plans.set(mutation.payload.plan.id,{...mutation.payload.plan});else if(mutation.type==="PLAN_DELETE")plans.delete(mutation.payload.planId);}return [...plans.values()].sort((a,b)=>a.name.localeCompare(b.name)||a.id.localeCompare(b.id));}
export function missingMutations(mutations:readonly ProgressMutation[],knownMutationIds:readonly string[]):ProgressMutation[]{const known=new Set(knownMutationIds);return mutations.filter((m)=>!known.has(m.mutationId)).sort(compareMutations);}
export function bootstrapProgressMutations(progress:readonly ProblemProgress[],installationId:string,source:SyncSource):ProgressMutation[]{return progress.map((record)=>{const occurredAt=record.lastAttemptAt??record.solvedAt??record.masteredAt??record.firstSeenAt??new Date(0).toISOString();return{protocolVersion:1,schemaVersion:1,mutationId:`${source}:bootstrap:${record.slug}:${occurredAt}`,installationId,source,type:"PROBLEM_STATE_SET",occurredAt,payload:{progress:{...record}}};});}
export function createTargetsMutation(targetCompanies:readonly string[],installationId:string,source:SyncSource,occurredAt:string,mutationId:string):ProgressMutation{return{protocolVersion:1,schemaVersion:1,mutationId,installationId,source,type:"TARGETS_SET",occurredAt,payload:{targetCompanies:normalizeTargets(targetCompanies)}};}
