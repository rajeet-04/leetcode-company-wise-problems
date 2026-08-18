"use client";

import { problems } from "@/src/data/catalog";
import { useProgress } from "../progress-provider";

export default function InsightsPage() {
  const { solved } = useProgress();
  const coverage = problems.length ? Math.round((solved.size / problems.length) * 1000) / 10 : 0;
  return <main className="mx-auto w-full max-w-[1440px] px-6 py-12 lg:px-10"><p className="text-xs font-semibold uppercase tracking-[.18em] text-[#6878e8]">Insights</p><h1 className="mt-4 text-4xl font-semibold tracking-[-.05em] sm:text-5xl">Personal analytics</h1><p className="mt-4 max-w-2xl text-sm leading-6 text-black/55">Only simple verified local facts are shown in this foundation phase; readiness and study analytics will come from the shared analytics package later.</p><div className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-black/10 bg-black/10 sm:grid-cols-2"><div className="bg-white p-5"><p className="text-xs text-black/40">Solved locally</p><p className="mt-2 text-3xl font-semibold">{solved.size.toLocaleString()}</p></div><div className="bg-white p-5"><p className="text-xs text-black/40">Raw catalog coverage</p><p className="mt-2 text-3xl font-semibold">{coverage}%</p></div></div></main>;
}
