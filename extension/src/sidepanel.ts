import type { ExtensionResponse } from "./messages";

async function refresh() {
  const root = document.querySelector<HTMLElement>("#app");
  if (!root) return;
  const response = await chrome.runtime.sendMessage({ type: "state:get-current" }) as ExtensionResponse;
  if (!response.ok || !response.data) {
    root.innerHTML = `<p class="eyebrow">Leet Progress</p><h1>Open a LeetCode problem</h1><p>The panel will follow the current problem in this browser profile.</p>`;
    return;
  }
  const { problem, priority } = response.data;
  const companies = [...new Set(problem.observations.map((item) => item.company))].sort();
  root.replaceChildren();
  const eyebrow = document.createElement("p"); eyebrow.className = "eyebrow"; eyebrow.textContent = "Current problem";
  const h1 = document.createElement("h1"); h1.textContent = problem.title;
  const score = document.createElement("div"); score.className = "hero-score"; score.textContent = `Priority ${priority.score} · ${priority.tier}`;
  const meta = document.createElement("p"); meta.textContent = `${problem.difficulty || "—"} · ${companies.length} companies`;
  const list = document.createElement("div"); list.className = "chips";
  for (const company of companies.slice(0, 20)) { const chip = document.createElement("span"); chip.textContent = company; list.append(chip); }
  root.append(eyebrow, h1, score, meta, list);
}

void refresh();
window.setInterval(() => void refresh(), 1000);
