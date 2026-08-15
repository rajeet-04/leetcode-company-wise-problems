import type { Problem } from "@/src/data/catalog";

export type Filters = { query: string; companies: string[]; difficulties: string[]; periods: string[]; solved: "all" | "solved" | "unsolved"; sort: "relevance" | "title" | "companies" | "difficulty" };
export function filterProblems(items: Problem[], filters: Filters, solved: Set<string>) {
  const q = filters.query.trim().toLowerCase();
  return items.filter((p) => {
    const haystack = [p.title, p.slug, p.id, ...p.companies, ...p.topics].join(" ").toLowerCase();
    const companyMatch = !filters.companies.length || filters.companies.some((company) => p.companies.includes(company));
    const difficultyMatch = !filters.difficulties.length || filters.difficulties.includes(p.difficulty);
    const periodMatch = !filters.periods.length || filters.periods.some((period) => p.periods.includes(period as never));
    return (!q || haystack.includes(q)) && companyMatch && difficultyMatch && periodMatch && (filters.solved === "all" || (filters.solved === "solved" ? solved.has(p.slug) || solved.has(p.id) : !solved.has(p.slug) && !solved.has(p.id)));
  }).sort((a, b) => filters.sort === "companies" ? b.companies.length - a.companies.length : filters.sort === "difficulty" ? a.difficulty.localeCompare(b.difficulty) : a.title.localeCompare(b.title));
}
