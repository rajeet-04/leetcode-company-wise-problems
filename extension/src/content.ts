import type { ExtensionResponse } from "./messages";
import { createLocationWatcher, extractProblemSlug } from "./problem-detector";

const ROOT_ID = "leet-progress-extension-root";
const SUBMISSION_NAMESPACE = "LEET_PROGRESS_SUBMISSION_OBSERVED";

function removeBadge() { document.getElementById(ROOT_ID)?.remove(); }

async function renderForSlug(slug: string | null) {
  if (!slug) { removeBadge(); return; }
  await chrome.runtime.sendMessage({ type: "state:set-current", slug });
  const response = await chrome.runtime.sendMessage({ type: "problem:lookup", slug }) as ExtensionResponse;
  if (!response.ok || !response.data) { removeBadge(); return; }
  let root = document.getElementById(ROOT_ID);
  if (!root) { root = document.createElement("aside"); root.id = ROOT_ID; document.documentElement.append(root); }
  const { problem, priority } = response.data;
  const companies = [...new Set(problem.observations.map((item) => item.company))];
  root.replaceChildren();
  const heading = document.createElement("strong"); heading.textContent = "Leet Progress";
  const score = document.createElement("span"); score.className = "lp-score"; score.textContent = `${priority.score}`;
  const title = document.createElement("div"); title.className = "lp-title"; title.textContent = problem.title;
  const meta = document.createElement("div"); meta.className = "lp-meta"; meta.textContent = `${problem.difficulty || "—"} · ${companies.length} ${companies.length === 1 ? "company" : "companies"}`;
  const button = document.createElement("button"); button.type = "button"; button.textContent = "Open panel"; button.addEventListener("click", () => void chrome.runtime.sendMessage({ type: "panel:open" }));
  root.append(heading, score, title, meta, button);
}

window.addEventListener("message", (event) => {
  if (event.source !== window || event.origin !== "https://leetcode.com") return;
  const data = event.data as { namespace?: unknown; fingerprint?: unknown; outcome?: unknown; observedAt?: unknown };
  if (data?.namespace !== SUBMISSION_NAMESPACE || typeof data.fingerprint !== "string" || typeof data.observedAt !== "string") return;
  const slug = extractProblemSlug(location.pathname);
  if (!slug) return;
  void chrome.runtime.sendMessage({ type: "progress:submission", slug, outcome: data.outcome, fingerprint: data.fingerprint, observedAt: data.observedAt });
});

createLocationWatcher((slug) => void renderForSlug(slug));
