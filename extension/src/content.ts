import type { ExtensionResponse } from "./messages";
import { nextLauncherMode, type LauncherMode } from "./launcher-state";
import { createLocationWatcher, extractProblemSlug } from "./problem-detector";

const ROOT_ID = "leet-progress-extension-root";
const SUBMISSION_NAMESPACE = "LEET_PROGRESS_SUBMISSION_OBSERVED";

let launcherMode: LauncherMode = "expanded";
let currentSlug: string | null = null;

function removeBadge() {
  document.getElementById(ROOT_ID)?.remove();
}

function renderMinimized(root: HTMLElement, score: number) {
  root.dataset.mode = "minimized";
  root.replaceChildren();
  const launcher = document.createElement("button");
  launcher.type = "button";
  launcher.className = "lp-minimized";
  launcher.setAttribute("aria-label", "Expand Leet Progress");
  launcher.title = "Expand Leet Progress";
  const mark = document.createElement("span");
  mark.textContent = "LP";
  const value = document.createElement("strong");
  value.textContent = String(score);
  launcher.append(mark, value);
  launcher.addEventListener("click", () => {
    launcherMode = nextLauncherMode(launcherMode, "restore");
    if (currentSlug) void renderForSlug(currentSlug);
  });
  root.append(launcher);
}

async function renderForSlug(slug: string | null) {
  currentSlug = slug;
  if (!slug) { removeBadge(); return; }
  await chrome.runtime.sendMessage({ type: "state:set-current", slug });
  const response = await chrome.runtime.sendMessage({ type: "problem:lookup", slug }) as ExtensionResponse;
  if (!response.ok || !response.data) { removeBadge(); return; }

  let root = document.getElementById(ROOT_ID);
  if (!root) {
    root = document.createElement("aside");
    root.id = ROOT_ID;
    document.documentElement.append(root);
  }

  const { problem, intelligence } = response.data;
  if (launcherMode === "minimized") {
    renderMinimized(root, intelligence.priority.score);
    return;
  }

  root.dataset.mode = "expanded";
  const companies = [...new Set(problem.observations.map((item) => item.company))];
  root.replaceChildren();

  const top = document.createElement("div");
  top.className = "lp-top";
  const heading = document.createElement("strong");
  heading.textContent = "Leet Progress";
  const score = document.createElement("span");
  score.className = "lp-score";
  score.textContent = `${intelligence.priority.score}`;
  top.append(heading, score);

  const title = document.createElement("div");
  title.className = "lp-title";
  title.textContent = problem.title;
  const overlap = intelligence.targetOverlap.total ? ` · ${intelligence.targetOverlap.count}/${intelligence.targetOverlap.total} targets` : "";
  const meta = document.createElement("div");
  meta.className = "lp-meta";
  meta.textContent = `${problem.difficulty || "—"} · ${companies.length} ${companies.length === 1 ? "company" : "companies"}${overlap}`;

  const actions = document.createElement("div");
  actions.className = "lp-actions";
  const openButton = document.createElement("button");
  openButton.type = "button";
  openButton.className = "lp-open";
  openButton.textContent = "Open panel";
  openButton.addEventListener("click", () => {
    openButton.disabled = true;
    openButton.textContent = "Opening…";
    void chrome.runtime.sendMessage({ type: "panel:open" }).then((raw) => {
      const result = raw as ExtensionResponse;
      if (!result.ok) throw new Error(result.error);
      launcherMode = nextLauncherMode(launcherMode, "panel-opened");
      if (currentSlug === slug) void renderForSlug(slug);
    }).catch((error) => {
      openButton.disabled = false;
      openButton.textContent = "Retry panel";
      openButton.title = error instanceof Error ? error.message : "Panel open failed";
    });
  });

  const minimizeButton = document.createElement("button");
  minimizeButton.type = "button";
  minimizeButton.className = "lp-minimize";
  minimizeButton.textContent = "−";
  minimizeButton.setAttribute("aria-label", "Minimize Leet Progress");
  minimizeButton.title = "Minimize";
  minimizeButton.addEventListener("click", () => {
    launcherMode = nextLauncherMode(launcherMode, "minimize");
    if (currentSlug === slug) void renderForSlug(slug);
  });

  actions.append(openButton, minimizeButton);
  root.append(top, title, meta, actions);
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
