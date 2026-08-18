"use client";

import { buildProblemIntelligence, calculateTopicReadiness } from "@leet-progress/intelligence";
import { isRevisionDue } from "@leet-progress/progress";
import { catalogV2BySlug, catalogV2Problems } from "@/src/data/catalog-v2";
import { useEffect, useState } from "react";
import { useProgress } from "../progress-provider";

export function TopicsClient() {
  const { progress, targetCompanies, completeRevision } = useProgress();
  const [now, setNow] = useState<string | null>(null);
  useEffect(() => setNow(new Date().toISOString()), []);
  const readiness = calculateTopicReadiness(catalogV2Problems, progress, targetCompanies);
  const due = now ? progress.filter((item) => isRevisionDue(item, now)).flatMap((item) => {
    const problem = catalogV2BySlug.get(item.slug);
    if (!problem) return [];
    const intelligence = buildProblemIntelligence(problem, { targetCompanies, progress: item });
    return [{ item, problem, priority: intelligence.priority.score }];
  }).sort((a, b) => (a.item.revisionDueAt ?? "").localeCompare(b.item.revisionDueAt ?? "") || b.priority - a.priority) : [];

  return (
    <main className="mx-auto w-full max-w-[1440px] px-6 py-12 lg:px-10">
      <p className="text-xs font-semibold uppercase tracking-[.18em] text-[#6878e8]">Topics + revision</p>
      <h1 className="mt-4 text-4xl font-semibold tracking-[-.05em] sm:text-5xl">Know what is weak. Revisit what is fading.</h1>
      <p className="mt-4 max-w-2xl text-sm leading-6 text-black/55">Topic readiness weights higher-value target-company problems more heavily than raw completion counts. Revision dates remain local to this browser profile.</p>

      <section className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {readiness.slice(0, 30).map((topic) => (
          <article key={topic.topic} className="rounded-2xl border border-black/10 bg-white p-4">
            <div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{topic.topic}</p><p className="mt-1 text-xs text-black/45">{topic.solvedProblems}/{topic.totalProblems} solved · {topic.attemptedProblems} attempted</p></div><strong className="text-xl">{topic.score}</strong></div>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-black/[.06]"><div className="h-full rounded-full bg-[#6878e8]" style={{ width: `${topic.score}%` }} /></div>
            <p className="mt-2 text-[11px] font-semibold uppercase tracking-wider text-black/35">{topic.level}</p>
          </article>
        ))}
      </section>

      <section className="mt-10 rounded-2xl border border-black/10 bg-white p-5 sm:p-6">
        <div className="flex items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[.14em] text-black/40">Revision queue</p><h2 className="mt-2 text-2xl font-semibold">{now ? `${due.length} due now` : "Checking local schedule…"}</h2></div></div>
        <div className="mt-4 divide-y divide-black/[.06]">
          {due.map(({ item, problem, priority }) => (
            <div key={item.slug} className="flex flex-wrap items-center justify-between gap-3 py-4">
              <div><p className="font-semibold">{problem.title}</p><p className="mt-1 text-xs text-black/45">Priority {priority} · due {new Date(item.revisionDueAt!).toLocaleDateString()} · {item.revisitCount} previous reviews</p></div>
              <button type="button" onClick={() => completeRevision(item.slug, priority)} className="rounded-full bg-[#171717] px-4 py-2 text-xs font-semibold text-white">Review completed</button>
            </div>
          ))}
          {now && !due.length && <p className="py-8 text-center text-sm text-black/45">No revisions are due right now.</p>}
        </div>
      </section>
    </main>
  );
}
