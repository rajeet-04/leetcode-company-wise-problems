const REQUEST_TYPE = "LEET_PROGRESS_HISTORY_REQUEST";
const RESULT_TYPE = "LEET_PROGRESS_HISTORY_RESULT";
const query = `query userProgressQuestionList($filters: UserProgressQuestionListInput) { userProgressQuestionList(filters: $filters) { totalNum questions { frontendId titleSlug questionStatus } } }`;

let running = false;

function respond(requestId: string, payload: Record<string, unknown>) {
  window.postMessage({ type: RESULT_TYPE, version: 1, requestId, ...payload }, window.location.origin);
}

window.addEventListener("message", (event) => {
  if (event.source !== window || event.origin !== window.location.origin) return;
  const data = event.data as { type?: unknown; requestId?: unknown };
  if (data?.type !== REQUEST_TYPE || typeof data.requestId !== "string" || !data.requestId) return;
  const requestId = data.requestId;
  if (running) {
    respond(requestId, { ok: false, error: "history-import-already-running" });
    return;
  }

  running = true;
  void (async () => {
    const limit = 50;
    let skip = 0;
    let total = Number.POSITIVE_INFINITY;
    const solved = new Set<string>();

    while (skip < total) {
      const response = await fetch("/graphql/", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "x-operation-name": "userProgressQuestionList",
        },
        body: JSON.stringify({
          operationName: "userProgressQuestionList",
          variables: { filters: { skip, limit } },
          query,
        }),
      });
      if (!response.ok) throw new Error(`leetcode-http-${response.status}`);
      const json = await response.json() as {
        errors?: unknown;
        data?: { userProgressQuestionList?: { totalNum?: unknown; questions?: unknown } };
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

    respond(requestId, { ok: true, slugs: [...solved].sort((a, b) => a.localeCompare(b)) });
  })().catch((error) => {
    respond(requestId, { ok: false, error: error instanceof Error ? error.message : "history-import-failed" });
  }).finally(() => {
    running = false;
  });
});
