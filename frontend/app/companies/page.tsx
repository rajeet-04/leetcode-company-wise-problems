import Link from "next/link";
import { problems } from "@/src/data/catalog";

export default function CompaniesPage() {
  const counts = new Map<string, number>();
  for (const problem of problems) for (const company of problem.companies) counts.set(company, (counts.get(company) ?? 0) + 1);
  const companies = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));

  return <main className="mx-auto w-full max-w-[1440px] px-6 py-12 lg:px-10"><p className="text-xs font-semibold uppercase tracking-[.18em] text-[#6878e8]">Companies</p><h1 className="mt-4 text-4xl font-semibold tracking-[-.05em] sm:text-5xl">Company intelligence</h1><p className="mt-4 max-w-2xl text-sm leading-6 text-black/55">Browse the companies represented in the catalog. Readiness, trends and next-action intelligence are added in later phases from shared calculations.</p><div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{companies.slice(0, 60).map(([company, count]) => <Link key={company} href={`/companies/${encodeURIComponent(company)}`} className="rounded-2xl border border-black/10 bg-white p-4 transition hover:border-[#6878e8]"><p className="font-semibold">{company}</p><p className="mt-1 text-xs text-black/45">{count.toLocaleString()} catalog problems</p></Link>)}</div></main>;
}
