import { notFound } from "next/navigation";
import { problems } from "@/src/data/catalog";

export const instant = false;

export default async function ProblemPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const problem = problems.find((item) => item.slug === slug);
  if (!problem) notFound();
  return <main className="mx-auto w-full max-w-4xl px-6 py-12 lg:px-10"><p className="text-xs font-semibold uppercase tracking-[.18em] text-[#6878e8]">Problem</p><h1 className="mt-4 text-4xl font-semibold tracking-[-.04em]">{problem.title}</h1><div className="mt-8 grid gap-3 sm:grid-cols-2"><Fact label="Difficulty" value={problem.difficulty || "—"}/><Fact label="Companies" value={String(problem.companies.length)}/><Fact label="Windows" value={problem.periods.join(", ") || "—"}/><Fact label="Topics" value={problem.topics.join(", ") || "—"}/></div><div className="mt-6 flex flex-wrap gap-2">{problem.companies.map((company) => <span key={company} className="rounded-full bg-black/[.05] px-3 py-1.5 text-xs">{company}</span>)}</div><a href={problem.url} target="_blank" rel="noreferrer" className="mt-8 inline-flex rounded-full bg-[#171717] px-4 py-2.5 text-xs font-semibold text-white">Open on LeetCode</a></main>;
}
function Fact({label,value}:{label:string;value:string}){return <div className="rounded-2xl border border-black/10 bg-white p-4"><p className="text-[10px] uppercase tracking-wider text-black/40">{label}</p><p className="mt-2 text-sm font-medium">{value}</p></div>}
