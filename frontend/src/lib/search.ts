import type { Problem } from "@/src/data/catalog";

export type Filters = { query: string; company: string; difficulty: string; period: string; solved: "all" | "solved" | "unsolved"; sort: "relevance" | "title" | "companies" | "difficulty" };
export function filterProblems(items: Problem[], filters: Filters, solved: Set<string>) {
  const q = filters.query.trim().toLowerCase();
  return items.filter((p) => {
    const haystack = [p.title, p.slug, p.id, ...p.companies, ...p.topics].join(" ").toLowerCase();
    return (!q || haystack.includes(q)) && (!filters.company || p.companies.includes(filters.company)) && (!filters.difficulty || p.difficulty === filters.difficulty) && (!filters.period || p.periods.includes(filters.period as never)) && (filters.solved === "all" || (filters.solved === "solved" ? solved.has(p.slug) || solved.has(p.id) : !solved.has(p.slug) && !solved.has(p.id)));
  }).sort((a, b) => filters.sort === "companies" ? b.companies.length - a.companies.length : filters.sort === "difficulty" ? a.difficulty.localeCompare(b.difficulty) : a.title.localeCompare(b.title));
}
