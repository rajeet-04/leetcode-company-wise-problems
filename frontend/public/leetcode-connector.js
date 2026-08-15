/* Run this script from a bookmark on https://leetcode.com/progress/. */
(async function () {
  const connectorOrigin = document.currentScript?.src
    ? new URL(document.currentScript.src).origin
    : "https://leet-progress-eta.vercel.app";
  const query = `query userProgressQuestionList($filters: UserProgressQuestionListInput) { userProgressQuestionList(filters: $filters) { totalNum questions { frontendId title titleSlug questionStatus } } }`;
  const limit = 50; let skip = 0; let total = Infinity; const all = [];
  try {
    while (skip < total) {
      const response = await fetch("/graphql/", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json", "x-operation-name": "userProgressQuestionList" }, body: JSON.stringify({ operationName: "userProgressQuestionList", variables: { filters: { skip, limit } }, query }) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const json = await response.json();
      if (json.errors) throw new Error("LeetCode returned a GraphQL error");
      const result = json?.data?.userProgressQuestionList;
      if (!result || !Array.isArray(result.questions) || typeof result.totalNum !== "number") throw new Error("LeetCode response schema changed");
      total = result.totalNum; all.push(...result.questions); if (!result.questions.length) break; skip += limit;
    }
    const problems = [...new Map(all.filter((q) => q.questionStatus === "SOLVED").map((q) => [q.titleSlug || q.frontendId, { id: String(q.frontendId || ""), title: String(q.title || ""), slug: String(q.titleSlug || "") }])).values()];
    if (!window.opener) throw new Error("Open the importer from Leet Progress first");
    const appOrigins = new Set([connectorOrigin, "http://localhost:3000"]);
    for (const appOrigin of appOrigins) {
      window.opener.postMessage({ type: "LEETCODE_PROGRESS", version: 1, problems }, appOrigin);
    }
    alert(`Imported ${problems.length} solved problems. Return to Leet Progress.`);
  } catch (error) { alert(`Leet Progress import failed: ${error instanceof Error ? error.message : "Unknown error"}`); }
})();
