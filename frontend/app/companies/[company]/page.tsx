import Link from "next/link";
import { notFound } from "next/navigation";
import { problems } from "@/src/data/catalog";

export const instant = false;

export default async function CompanyPage({ params }: { params: Promise<{ company: string }> }) {
  const { company: rawCompany } = await params;
  const company = decodeURIComponent(rawCompany);
  const matches = problems.filter((problem) => problem.companies.includes(company));
  if (!matches.length) notFound();
  return <main className="mx-auto w-full max-w-5xl px-6 py-12 lg:px-10"><p className="text-xs font-semibold uppercase tracking-[.18em] text-[#6878e8]">Company</p><h1 className="mt-4 text-4xl font-semibold tracking-[-.04em]">{company}</h1><p className="mt-3 text-sm text-black/55">{matches.length.toLocaleString()} problems currently represented in the catalog.</p><div className="mt-8 space-y-2">{matches.slice(0, 30).map((problem) => <Link key={problem.slug} href={`/problems/${problem.slug}`} className="flex items-center justify-between rounded-xl border border-black/10 bg-white px-4 py-3 text-sm hover:border-[#6878e8]"><span className="font-medium">{problem.title}</span><span className="text-xs text-black/40">{problem.difficulty || "—"}</span></Link>)}</div><Link href={`/explore?company=${encodeURIComponent(company)}`} className="mt-8 inline-flex rounded-full border border-black/10 bg-white px-4 py-2.5 text-xs font-semibold">Explore all {company} questions</Link></main>;
}
