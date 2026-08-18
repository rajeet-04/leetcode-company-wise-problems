import type { ExtensionResponse } from "./messages";

async function render() {
  const root = document.querySelector<HTMLElement>("#app");
  if (!root) return;
  const response = await chrome.runtime.sendMessage({ type: "state:get-current" }) as ExtensionResponse;
  if (!response.ok || !response.data) {
    root.innerHTML = `<h1>Leet Progress</h1><p>Open a LeetCode problem to start contextual intelligence.</p><small>User progress stays in local extension storage.</small>`;
    return;
  }
  const { problem, priority } = response.data;
  const count = new Set(problem.observations.map((item) => item.company)).size;
  root.innerHTML = `<h1>Leet Progress</h1><p class="title"></p><div class="metric"><span>Priority</span><strong>${priority.score}</strong></div><div class="metric"><span>Companies</span><strong>${count}</strong></div><small>Local extension state only.</small>`;
  const title = root.querySelector<HTMLElement>(".title");
  if (title) title.textContent = problem.title;
}

void render();
