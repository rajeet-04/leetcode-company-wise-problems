export type SolvedFilter = "all" | "solved" | "unsolved";
export type CompanyMatchMode = "any" | "all";
export type ProblemSort = "relevance" | "title" | "companies" | "difficulty";

export type Filters = {
  query: string;
  companies: string[];
  difficulties: string[];
  periods: string[];
  solved: SolvedFilter;
  sort: ProblemSort;
  companyMatch?: CompanyMatchMode;
};

export type SearchableProblem = {
  id?: string;
  title: string;
  slug: string;
  difficulty: string;
  companies: string[];
  periods: string[];
  topics: string[];
};

const DIFFICULTY_ORDER: Record<string, number> = {
  EASY: 0,
  MEDIUM: 1,
  HARD: 2,
};

function isSolved(problem: SearchableProblem, solved: ReadonlySet<string>): boolean {
  return solved.has(problem.slug) || (!!problem.id && solved.has(problem.id));
}

function relevanceScore(problem: SearchableProblem, query: string): number {
  if (!query) return 0;
  const title = problem.title.toLowerCase();
  const slug = problem.slug.toLowerCase();
  if (title === query || slug === query) return 500;
  if (title.startsWith(query) || slug.startsWith(query)) return 400;
  if (title.includes(query) || slug.includes(query)) return 300;
  if (problem.topics.some((topic) => topic.toLowerCase() === query)) return 220;
  if (problem.topics.some((topic) => topic.toLowerCase().includes(query))) return 200;
  if (problem.companies.some((company) => company.toLowerCase() === query)) return 120;
  if (problem.companies.some((company) => company.toLowerCase().includes(query))) return 100;
  return 0;
}

function companyMatches(problem: SearchableProblem, selected: string[], mode: CompanyMatchMode): boolean {
  if (selected.length === 0) return true;
  return mode === "all"
    ? selected.every((company) => problem.companies.includes(company))
    : selected.some((company) => problem.companies.includes(company));
}

export function filterProblems<T extends SearchableProblem>(
  items: readonly T[],
  filters: Filters,
  solved: ReadonlySet<string>,
): T[] {
  const query = filters.query.trim().toLowerCase();
  const companyMatch = filters.companyMatch ?? "any";

  return items
    .filter((problem) => {
      const queryMatch = !query || relevanceScore(problem, query) > 0;
      const difficultyMatch =
        filters.difficulties.length === 0 || filters.difficulties.includes(problem.difficulty);
      const periodMatch =
        filters.periods.length === 0 || filters.periods.some((period) => problem.periods.includes(period));
      const solvedValue = isSolved(problem, solved);
      const solvedMatch =
        filters.solved === "all" ||
        (filters.solved === "solved" ? solvedValue : !solvedValue);

      return (
        queryMatch &&
        companyMatches(problem, filters.companies, companyMatch) &&
        difficultyMatch &&
        periodMatch &&
        solvedMatch
      );
    })
    .sort((a, b) => {
      if (filters.sort === "companies") {
        return b.companies.length - a.companies.length || a.title.localeCompare(b.title);
      }
      if (filters.sort === "difficulty") {
        return (
          (DIFFICULTY_ORDER[a.difficulty] ?? 99) - (DIFFICULTY_ORDER[b.difficulty] ?? 99) ||
          a.title.localeCompare(b.title)
        );
      }
      if (filters.sort === "relevance" && query) {
        return relevanceScore(b, query) - relevanceScore(a, query) || a.title.localeCompare(b.title);
      }
      return a.title.localeCompare(b.title);
    });
}
