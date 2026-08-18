"use client";

import { calculatePersonalAnalytics } from "@leet-progress/analytics";
import { catalogV2Problems } from "@/src/data/catalog-v2";
import { useEffect, useMemo, useState } from "react";
import { useProgress } from "../progress-provider";

export default function InsightsPage() {
  const { progress, targetCompanies } = useProgress();
  const [now, setNow] = useState<string | null>(null);
  useEffect(() => setNow(new Date().toISOString()), []);
  const analytics = useMemo(() => now ? calculatePersonalAnalytics(catalogV2Problems, progress, targetCompanies, now) : null, [now, progress, targetCompanies]);

  return (
    <main className="mx-auto w-full max-w-[1440px] px-6 py-12 lg:px-10">
      <p className="text-xs font-semibold uppercase tracking-[.18em] text-[#6878e8]">Insights</p>
      <h1 className="mt-4 text-4xl font-semibold tracking-[-.05em] sm:text-5xl">Readiness you can explain.</h1>
      <p className="mt-4 max-w-2xl text-sm leading-6 text-black/55">All metrics below are calculated on-device from your local progress and the public company catalog. No personal analytics are uploaded.</p>

      <section className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-black/10 bg-black/10 sm:grid-cols-2 lg:grid-cols-5">
        <Metric label="Solved" value={analytics?.solvedTotal ?? 0} />
        <Metric label="Solved / 7d" value={analytics?.solvedLast7Days ?? 0} />
        <Metric label="Solved / 30d" value={analytics?.solvedLast30Days ?? 0} />
        <Metric label="Attempts" value={analytics?.totalAttempts ?? 0} />
        <Metric label="Revisions due" value={analytics?.revisionsDue ?? 0} />
      </section>

      <section className="mt-8 grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-black/10 bg-white p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[.14em] text-black/40">Target company readiness</p>
          <div className="mt-4 space-y-4">
            {(analytics?.targetReadiness ?? []).map((company) => (
              <article key={company.company} className="rounded-2xl bg-black/[.025] p-4">
                <div className="flex items-center justify-between gap-4"><div><h2 className="font-semibold">{company.company}</h2><p className="mt-1 text-xs text-black/45">{company.solvedCount}/{company.problemCount} catalog problems covered</p></div><strong className="text-3xl">{company.score}</strong></div>
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                  <Component label="Priority coverage" value={company.components.highPriorityCoverage} />
                  <Component label="Topic coverage" value={company.components.topicCoverage} />
                  <Component label="Difficulty coverage" value={company.components.difficultyCoverage} />
                  <Component label="Revision health" value={company.components.revisionHealth} />
                </div>
              </article>
            ))}
            {now && !(analytics?.targetReadiness.length) && <p className="py-6 text-sm text-black/45">Choose target companies to calculate company readiness.</p>}
          </div>
        </div>

        <div className="rounded-2xl border border-black/10 bg-white p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[.14em] text-black/40">Study load</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Component label="Attempted problems" value={analytics?.attemptedProblems ?? 0} raw />
            <Component label="Attempts / tracked problem" value={analytics?.attemptBurden ?? 0} raw />
          </div>
          <p className="mt-5 text-sm leading-6 text-black/50">Attempt burden is descriptive, not a grade. A higher value can mean useful persistence or a weak pattern that deserves review.</p>
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-black/10 bg-white p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[.14em] text-black/40">Topic readiness</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(analytics?.topicReadiness ?? []).slice(0, 18).map((topic) => (
            <div key={topic.topic} className="rounded-xl bg-black/[.025] p-3"><div className="flex items-center justify-between gap-3"><span className="text-sm font-medium">{topic.topic}</span><strong>{topic.score}</strong></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/[.06]"><div className="h-full rounded-full bg-[#6878e8]" style={{ width: `${topic.score}%` }} /></div></div>
          ))}
        </div>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="bg-white p-5"><p className="text-[10px] uppercase tracking-wider text-black/40">{label}</p><p className="mt-2 text-3xl font-semibold">{value.toLocaleString()}</p></div>;
}
function Component({ label, value, raw = false }: { label: string; value: number; raw?: boolean }) {
  return <div className="rounded-xl bg-white p-3"><p className="text-[10px] uppercase tracking-wider text-black/40">{label}</p><p className="mt-1 text-lg font-semibold">{raw ? value : `${value}%`}</p></div>;
}
