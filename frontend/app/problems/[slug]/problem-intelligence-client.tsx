"use client";

import { buildProblemIntelligence } from "@leet-progress/intelligence";
import type { CatalogProblem } from "@leet-progress/types";
import { useMemo } from "react";
import { useProgress } from "../../progress-provider";

export function ProblemIntelligenceClient({ problem }: { problem: CatalogProblem }) {
  const { progress, targetCompanies, toggleSolved } = useProgress();
  const localProgress = progress.find((item) => item.slug === problem.slug) ?? null;
  const intelligence = useMemo(
    () => buildProblemIntelligence(problem, { targetCompanies, progress: localProgress }),
    [localProgress, problem, targetCompanies],
  );
  const companies = [...new Set(problem.observations.map((observation) => observation.company))].sort();
  const solved = ["solved", "revision_due", "mastered"].includes(intelligence.progressStatus);

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-12 lg:px-10">
      <p className="text-xs font-semibold uppercase tracking-[.18em] text-[#6878e8]">Problem intelligence</p>
      <div className="mt-4 flex flex-wrap items-start justify-between gap-5">
        <div>
          <h1 className="text-4xl font-semibold tracking-[-.04em]">{problem.title}</h1>
          <p className="mt-2 text-sm text-black/50">{problem.difficulty || "—"} · {companies.length} companies · {problem.topics.join(" · ") || "No topics"}</p>
        </div>
        <div className="rounded-2xl bg-[#171717] px-5 py-4 text-white">
          <p className="text-[10px] uppercase tracking-[.14em] text-white/55">Interview priority</p>
          <p className="mt-1 text-3xl font-semibold">{intelligence.priority.score}</p>
          <p className="text-xs capitalize text-white/65">{intelligence.priority.tier.replace("-", " ")}</p>
        </div>
      </div>

      <section className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Target overlap" value={`${intelligence.targetOverlap.count}/${intelligence.targetOverlap.total || 0}`} />
        <Metric label="Recency" value={String(intelligence.recency)} />
        <Metric label="Trend" value={String(intelligence.trend)} />
        <Metric label="Frequency" value={String(intelligence.frequency)} />
      </section>

      <section className="mt-8 grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
        <div className="rounded-2xl border border-black/10 bg-white p-5">
          <h2 className="font-semibold">Company observations</h2>
          <div className="mt-4 space-y-2">
            {problem.observations.map((observation, index) => (
              <div key={`${observation.company}-${observation.window}-${index}`} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded-xl bg-black/[.035] px-3 py-2 text-xs">
                <span className="font-medium">{observation.company}</span>
                <span className="text-black/45">{observation.window}</span>
                <span className="min-w-12 text-right text-black/55">{observation.frequency == null ? "—" : observation.frequency}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-5">
          <div className="rounded-2xl border border-black/10 bg-white p-5">
            <h2 className="font-semibold">Why this score</h2>
            <div className="mt-3 space-y-2">
              {intelligence.priority.reasons.map((reason) => <div key={reason.code} className="flex items-center justify-between text-xs"><span>{reason.code.replaceAll("-", " ")}</span><strong>{reason.weight}</strong></div>)}
              {!intelligence.priority.reasons.length && <p className="text-sm text-black/45">No strong priority signals yet.</p>}
            </div>
          </div>
          <div className="rounded-2xl border border-black/10 bg-white p-5">
            <p className="text-xs text-black/45">Local progress</p>
            <p className="mt-1 text-lg font-semibold capitalize">{intelligence.progressStatus.replace("_", " ")}</p>
            <button onClick={() => toggleSolved(problem.slug)} className="mt-4 rounded-full bg-[#171717] px-4 py-2 text-xs font-semibold text-white">{solved ? "Mark unsolved" : "Mark solved"}</button>
          </div>
        </div>
      </section>

      <a href={problem.url} target="_blank" rel="noreferrer" className="mt-8 inline-flex rounded-full border border-black/10 bg-white px-4 py-2.5 text-xs font-semibold">Open on LeetCode</a>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-black/10 bg-white p-4"><p className="text-[10px] uppercase tracking-wider text-black/40">{label}</p><p className="mt-2 text-2xl font-semibold">{value}</p></div>;
}
