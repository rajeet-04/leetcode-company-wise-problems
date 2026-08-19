const HISTORY_QUERY = `query userProgressQuestionList($filters: UserProgressQuestionListInput) { userProgressQuestionList(filters: $filters) { totalNum questions { frontendId titleSlug questionStatus } } }`;

export async function fetchSolvedHistorySlugs(fetcher: typeof fetch = fetch): Promise<string[]> {
  const limit = 50;
  let skip = 0;
  let total = Number.POSITIVE_INFINITY;
  const solved = new Set<string>();

  while (skip < total) {
    const response = await fetcher("/graphql/", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "x-operation-name": "userProgressQuestionList",
      },
      body: JSON.stringify({
        operationName: "userProgressQuestionList",
        variables: { filters: { skip, limit } },
        query: HISTORY_QUERY,
      }),
    });
    if (!response.ok) throw new Error(`leetcode-http-${response.status}`);

    const json = await response.json() as {
      errors?: unknown;
      data?: { userProgressQuestionList?: { totalNum?: unknown; questions?: unknown } | null };
    };
    if (json.errors) throw new Error("leetcode-graphql-error");
    const result = json.data?.userProgressQuestionList;
    if (!result || typeof result.totalNum !== "number" || !Array.isArray(result.questions)) {
      throw new Error("leetcode-history-schema-changed");
    }

    total = result.totalNum;
    for (const item of result.questions) {
      if (!item || typeof item !== "object") continue;
      const question = item as { titleSlug?: unknown; questionStatus?: unknown };
      if (question.questionStatus === "SOLVED" && typeof question.titleSlug === "string" && question.titleSlug) {
        solved.add(question.titleSlug);
      }
    }

    if (result.questions.length === 0) break;
    skip += limit;
  }

  return [...solved].sort((a, b) => a.localeCompare(b));
}
