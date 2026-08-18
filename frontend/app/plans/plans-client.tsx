"use client";

import { buildAdaptivePlan, type InterviewPlan } from "@leet-progress/plans";
import { catalogV2BySlug, catalogV2Problems } from "@/src/data/catalog-v2";
import { useEffect, useMemo, useState } from "react";
import { useProgress } from "../progress-provider";

export function PlansClient() {
  const { progress, targetCompanies, plans, savePlan, deletePlan, ready } = useProgress();
  const [now, setNow] = useState<string | null>(null);
  const [name, setName] = useState("Interview plan");
  const [interviewDate, setInterviewDate] = useState("");
  const [dailyGoal, setDailyGoal] = useState(3);
  useEffect(() => setNow(new Date().toISOString()), []);

  const adaptive = useMemo(() => new Map(
    now ? plans.map((plan) => [plan.id, buildAdaptivePlan(catalogV2Problems, progress, plan, now)] as const) : [],
  ), [now, plans, progress]);

  const createPlan = () => {
    if (!ready || !targetCompanies.length) return;
    const at = new Date().toISOString();
    const plan: InterviewPlan = {
      id: crypto.randomUUID(),
      name: name.trim() || "Interview plan",
      targetCompanies: [...targetCompanies],
      ...(interviewDate ? { interviewDate } : {}),
      dailyProblemGoal: Math.max(1, dailyGoal),
      difficultyPreference: "balanced",
      excludedTopics: [],
      pinnedSlugs: [],
      deferredSlugs: [],
      createdAt: at,
      updatedAt: at,
    };
    savePlan(plan);
  };

  const updateOverride = (plan: InterviewPlan, slug: string, kind: "pin" | "defer") => {
    const pinned = new Set(plan.pinnedSlugs);
    const deferred = new Set(plan.deferredSlugs);
    if (kind === "pin") {
      if (pinned.has(slug)) pinned.delete(slug); else { pinned.add(slug); deferred.delete(slug); }
    } else {
      if (deferred.has(slug)) deferred.delete(slug); else { deferred.add(slug); pinned.delete(slug); }
    }
    savePlan({ ...plan, pinnedSlugs: [...pinned], deferredSlugs: [...deferred] });
  };

  return (
    <main className="mx-auto w-full max-w-[1440px] px-6 py-12 lg:px-10">
      <p className="text-xs font-semibold uppercase tracking-[.18em] text-[#6878e8]">Plans</p>
      <h1 className="mt-4 text-4xl font-semibold tracking-[-.05em] sm:text-5xl">Adaptive interview plans.</h1>
      <p className="mt-4 max-w-2xl text-sm leading-6 text-black/55">Plans store only your local definition and manual overrides. The daily queue is recalculated from current progress, target companies, revision needs and weak topics.</p>

      <section className="mt-8 grid gap-4 rounded-2xl border border-black/10 bg-white p-5 sm:grid-cols-[1fr_180px_140px_auto] sm:items-end">
        <label className="text-xs font-semibold text-black/55">Plan name<input value={name} onChange={(event) => setName(event.target.value)} className="mt-2 h-11 w-full rounded-xl bg-[#f4f4f2] px-3 text-sm outline-none focus:ring-2 focus:ring-[#6878e8]" /></label>
        <label className="text-xs font-semibold text-black/55">Interview date<input type="date" value={interviewDate} onChange={(event) => setInterviewDate(event.target.value)} className="mt-2 h-11 w-full rounded-xl bg-[#f4f4f2] px-3 text-sm outline-none focus:ring-2 focus:ring-[#6878e8]" /></label>
        <label className="text-xs font-semibold text-black/55">Problems / day<input type="number" min={1} max={20} value={dailyGoal} onChange={(event) => setDailyGoal(Number(event.target.value) || 1)} className="mt-2 h-11 w-full rounded-xl bg-[#f4f4f2] px-3 text-sm outline-none focus:ring-2 focus:ring-[#6878e8]" /></label>
        <button type="button" disabled={!ready || !targetCompanies.length} onClick={createPlan} className="h-11 rounded-full bg-[#171717] px-5 text-xs font-semibold text-white disabled:opacity-35">Create plan</button>
      </section>
      {!targetCompanies.length && <p className="mt-3 text-xs text-amber-700">Choose at least one target company on the Companies page before creating a plan.</p>}

      <div className="mt-8 space-y-6">
        {plans.map((plan) => {
          const derived = adaptive.get(plan.id);
          return (
            <article key={plan.id} className="rounded-3xl border border-black/10 bg-white p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div><p className="text-xs font-semibold uppercase tracking-[.14em] text-[#6878e8]">{plan.targetCompanies.join(" · ")}</p><h2 className="mt-2 text-2xl font-semibold">{plan.name}</h2><p className="mt-1 text-xs text-black/45">{derived?.daysRemaining == null ? "No interview date" : `${derived.daysRemaining} days remaining`} · {plan.dailyProblemGoal} per day</p></div>
                <button type="button" onClick={() => deletePlan(plan.id)} className="rounded-full border border-black/10 px-3 py-2 text-xs font-semibold text-black/55 hover:text-rose-600">Delete</button>
              </div>

              <div className="mt-5 grid gap-2 sm:grid-cols-5">
                <Bucket label="Must solve" count={derived?.buckets.mustSolve.length ?? 0} />
                <Bucket label="High" count={derived?.buckets.highPriority.length ?? 0} />
                <Bucket label="Revision" count={derived?.buckets.revision.length ?? 0} />
                <Bucket label="Weak area" count={derived?.buckets.weakArea.length ?? 0} />
                <Bucket label="Optional" count={derived?.buckets.optional.length ?? 0} />
              </div>

              <div className="mt-6">
                <p className="text-xs font-semibold uppercase tracking-[.14em] text-black/40">Today's queue</p>
                <div className="mt-2 divide-y divide-black/[.06]">
                  {(derived?.dailyQueue ?? []).map((slug, index) => {
                    const problem = catalogV2BySlug.get(slug);
                    if (!problem) return null;
                    const pinned = plan.pinnedSlugs.includes(slug);
                    return <div key={slug} className="flex flex-wrap items-center justify-between gap-3 py-3"><div><p className="text-sm font-semibold">{index + 1}. {problem.title}</p><p className="mt-1 text-xs text-black/40">{problem.difficulty || "—"} · {problem.topics.slice(0, 3).join(" · ")}</p></div><div className="flex gap-2"><button type="button" onClick={() => updateOverride(plan, slug, "pin")} className={`rounded-full px-3 py-1.5 text-[11px] font-semibold ${pinned ? "bg-[#6878e8] text-white" : "bg-black/[.05] text-black/55"}`}>{pinned ? "Pinned" : "Pin"}</button><button type="button" onClick={() => updateOverride(plan, slug, "defer")} className="rounded-full bg-black/[.05] px-3 py-1.5 text-[11px] font-semibold text-black/55">Defer</button></div></div>;
                  })}
                  {now && !(derived?.dailyQueue.length) && <p className="py-6 text-sm text-black/45">No queue items match this plan yet.</p>}
                </div>
              </div>
            </article>
          );
        })}
        {ready && !plans.length && <div className="rounded-2xl border border-dashed border-black/15 p-10 text-center text-sm text-black/45">No plans yet. Create one from your current target companies.</div>}
      </div>
    </main>
  );
}

function Bucket({ label, count }: { label: string; count: number }) {
  return <div className="rounded-xl bg-black/[.035] p-3"><p className="text-[10px] uppercase tracking-wider text-black/40">{label}</p><p className="mt-1 text-xl font-semibold">{count}</p></div>;
}
