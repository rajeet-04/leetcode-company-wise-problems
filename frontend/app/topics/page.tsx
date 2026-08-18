import { problems } from "@/src/data/catalog";

export default function TopicsPage() {
  const counts = new Map<string, number>();
  for (const problem of problems) for (const topic of problem.topics) counts.set(topic, (counts.get(topic) ?? 0) + 1);
  const topics = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  return <main className="mx-auto w-full max-w-[1440px] px-6 py-12 lg:px-10"><p className="text-xs font-semibold uppercase tracking-[.18em] text-[#6878e8]">Topics</p><h1 className="mt-4 text-4xl font-semibold tracking-[-.05em] sm:text-5xl">Topic coverage</h1><p className="mt-4 max-w-2xl text-sm leading-6 text-black/55">Catalog coverage now; weighted personal topic readiness and revision scheduling arrive in the dedicated intelligence phase.</p><div className="mt-8 flex flex-wrap gap-2">{topics.map(([topic, count]) => <span key={topic} className="rounded-full border border-black/10 bg-white px-3 py-2 text-xs"><strong>{topic}</strong><span className="ml-2 text-black/40">{count}</span></span>)}</div></main>;
}
