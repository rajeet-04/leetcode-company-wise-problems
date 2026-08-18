"use client";

import Link from "next/link";
import { problems } from "@/src/data/catalog";
import { useProgress } from "./progress-provider";

export default function TodayPage() {
  const { solved } = useProgress();
  const remaining = Math.max(0, problems.length - solved.size);

  return (
    <main className="mx-auto w-full max-w-[1440px] px-6 py-12 lg:px-10 lg:py-16">
      <p className="text-xs font-semibold uppercase tracking-[.18em] text-[#6878e8]">Today</p>
      <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-[-.05em] sm:text-6xl">
        Your preparation workspace,
        <span className="block text-black/35">ready for the next solve.</span>
      </h1>
      <p className="mt-5 max-w-2xl text-sm leading-6 text-black/55">
        Leet Progress keeps personal progress on this device. Recommendations, revision queues and plan intelligence will build on this local foundation in the next phases.
      </p>

      <section className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-black/10 bg-black/10 sm:grid-cols-3">
        <Metric label="Catalog problems" value={problems.length} />
        <Metric label="Solved locally" value={solved.size} />
        <Metric label="Remaining catalog" value={remaining} />
      </section>

      <section className="mt-8 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-black/10 bg-white p-6">
          <p className="text-xs font-semibold uppercase tracking-[.14em] text-black/40">Continue preparation</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-[-.03em]">Explore the company catalog</h2>
          <p className="mt-2 text-sm leading-6 text-black/50">Search by company, topic, difficulty and recent interview window using the shared intelligence filter layer.</p>
          <Link href="/explore" className="mt-6 inline-flex rounded-full bg-[#171717] px-4 py-2.5 text-xs font-semibold text-white">Open Explore</Link>
        </div>
        <div className="rounded-2xl border border-black/10 bg-white p-6">
          <p className="text-xs font-semibold uppercase tracking-[.14em] text-black/40">Privacy boundary</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-[-.03em]">Personal state stays local</h2>
          <p className="mt-2 text-sm leading-6 text-black/50">Solved state and future plans, notes, revision history and personal analytics are stored in your browser, not a Leet Progress cloud database.</p>
        </div>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="bg-white px-5 py-5"><p className="text-[11px] uppercase tracking-[.14em] text-black/40">{label}</p><p className="mt-2 text-2xl font-semibold">{value.toLocaleString()}</p></div>;
}
