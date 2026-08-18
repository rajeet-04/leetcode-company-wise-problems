"use client";

import Link from "next/link";
import { recommendProblems } from "@leet-progress/recommendations";
import { catalogV2Problems } from "@/src/data/catalog-v2";
import { useProgress } from "./progress-provider";

export default function TodayPage() {
  const { solved, progress, targetCompanies } = useProgress();
  const remaining = Math.max(0, catalogV2Problems.length - solved.size);
  const recommendations = recommendProblems(catalogV2Problems, {
    targetCompanies,
    progress,
    limit: 8,
  });

  return (
    <main className="mx-auto w-full max-w-[1440px] px-6 py-12 lg:px-10 lg:py-16">
      <p className="text-xs font-semibold uppercase tracking-[.18em] text-[#6878e8]">Today</p>
      <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-[-.05em] sm:text-6xl">
        Solve what matters next.
        <span className="block text-black/35">The queue adapts to your targets.</span>
      </h1>
      <p className="mt-5 max-w-2xl text-sm leading-6 text-black/55">Recommendations are calculated locally from company overlap, catalog priority and your progress. Nothing about your progress is uploaded.</p>

      <section className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-black/10 bg-black/10 sm:grid-cols-3">
        <Metric label="Catalog problems" value={catalogV2Problems.length} />
        <Metric label="Solved locally" value={solved.size} />
        <Metric label="Target companies" value={targetCompanies.length} />
      </section>

      <section className="mt-8 rounded-2xl border border-black/10 bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div><p className="text-xs font-semibold uppercase tracking-[.14em] text-black/40">Recommended next</p><h2 className="mt-2 text-2xl font-semibold">Highest-value local queue</h2></div>
          <Link href="/companies" className="rounded-full border border-black/10 px-3 py-2 text-xs font-semibold">Edit targets</Link>
        </div>
        <div className="mt-5 divide-y divide-black/[.06]">
          {recommendations.map((item, index) => (
            <Link key={item.slug} href={`/problems/${item.slug}`} className="grid gap-2 py-4 transition hover:bg-black/[.02] sm:grid-cols-[32px_1fr_auto] sm:items-center sm:px-2">
              <span className="text-xs font-semibold text-black/30">{String(index + 1).padStart(2, "0")}</span>
              <div><p className="font-semibold">{item.title}</p><p className="mt-1 text-xs text-black/45">{item.reasons.map((reason) => reason.replaceAll("-", " ")).join(" · ")}</p></div>
              <div className="text-left sm:text-right"><p className="text-xs font-semibold">Priority {item.priorityScore}</p><p className="mt-1 text-[11px] text-black/40">{item.difficulty || "—"}</p></div>
            </Link>
          ))}
          {!recommendations.length && <div className="py-10 text-center text-sm text-black/45">Choose target companies or create revision needs to generate your queue.</div>}
        </div>
      </section>

      <section className="mt-8 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-black/10 bg-white p-6"><p className="text-xs font-semibold uppercase tracking-[.14em] text-black/40">Explore</p><h2 className="mt-3 text-xl font-semibold">Browse beyond the queue</h2><p className="mt-2 text-sm leading-6 text-black/50">Search the full company catalog when you want to choose manually.</p><Link href="/explore" className="mt-5 inline-flex rounded-full bg-[#171717] px-4 py-2.5 text-xs font-semibold text-white">Open Explore</Link></div>
        <div className="rounded-2xl border border-black/10 bg-white p-6"><p className="text-xs font-semibold uppercase tracking-[.14em] text-black/40">Remaining catalog</p><p className="mt-3 text-3xl font-semibold">{remaining.toLocaleString()}</p><p className="mt-2 text-sm leading-6 text-black/50">This raw number is context only; the queue is intentionally weighted toward interview value rather than completion percentage.</p></div>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="bg-white px-5 py-5"><p className="text-[11px] uppercase tracking-[.14em] text-black/40">{label}</p><p className="mt-2 text-2xl font-semibold">{value.toLocaleString()}</p></div>;
}
