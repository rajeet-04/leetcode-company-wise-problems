"use client";

import Link from "next/link";
import { useProgress } from "../progress-provider";

export type CompanySummary = { company: string; count: number };

export function CompaniesClient({ companies }: { companies: CompanySummary[] }) {
  const { targetCompanies, toggleTargetCompany, ready } = useProgress();
  const targets = new Set(targetCompanies);

  return (
    <main className="mx-auto w-full max-w-[1440px] px-6 py-12 lg:px-10">
      <p className="text-xs font-semibold uppercase tracking-[.18em] text-[#6878e8]">Companies</p>
      <h1 className="mt-4 text-4xl font-semibold tracking-[-.05em] sm:text-5xl">Choose where you want to interview.</h1>
      <p className="mt-4 max-w-2xl text-sm leading-6 text-black/55">Target companies are stored locally and synchronized only with the extension installed in this browser profile. They directly affect problem priority and overlap intelligence.</p>
      <p className="mt-4 text-xs font-semibold text-black/45">{targetCompanies.length} target {targetCompanies.length === 1 ? "company" : "companies"}</p>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {companies.map(({ company, count }) => {
          const targeted = targets.has(company);
          return (
            <article key={company} className={`rounded-2xl border bg-white p-4 transition ${targeted ? "border-[#6878e8] ring-1 ring-[#6878e8]/20" : "border-black/10"}`}>
              <div className="flex items-start justify-between gap-3">
                <Link href={`/companies/${encodeURIComponent(company)}`} className="min-w-0 flex-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6878e8]">
                  <p className="truncate font-semibold">{company}</p>
                  <p className="mt-1 text-xs text-black/45">{count.toLocaleString()} catalog problems</p>
                </Link>
                <button
                  type="button"
                  disabled={!ready}
                  aria-pressed={targeted}
                  onClick={() => toggleTargetCompany(company)}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-semibold transition disabled:opacity-40 ${targeted ? "bg-[#6878e8] text-white" : "bg-black/[.05] text-black/60 hover:bg-black/[.09]"}`}
                >
                  {targeted ? "Targeting" : "Target"}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}
