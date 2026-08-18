import type { ExtensionResponse } from "./messages";

function row(label: string, value: string) {
  const element = document.createElement("div"); element.className = "metric";
  const left = document.createElement("span"); left.textContent = label;
  const right = document.createElement("strong"); right.textContent = value;
  element.append(left, right); return element;
}

async function refresh() {
  const root = document.querySelector<HTMLElement>("#app"); if (!root) return;
  const response = await chrome.runtime.sendMessage({ type: "state:get-current" }) as ExtensionResponse;
  if (!response.ok || !response.data) { root.innerHTML = `<p class="eyebrow">Leet Progress</p><h1>Open a LeetCode problem</h1><p>The panel will follow the current problem in this browser profile.</p>`; return; }
  const { problem, intelligence, recommendations, plan } = response.data;
  const companies = [...new Set(problem.observations.map((item) => item.company))].sort(); root.replaceChildren();
  const eyebrow=document.createElement("p");eyebrow.className="eyebrow";eyebrow.textContent="Current problem";
  const h1=document.createElement("h1");h1.textContent=problem.title;
  const score=document.createElement("div");score.className="hero-score";score.textContent=`Priority ${intelligence.priority.score} · ${intelligence.priority.tier}`;
  const meta=document.createElement("p");meta.textContent=`${problem.difficulty||"—"} · ${companies.length} companies · ${intelligence.progressStatus.replace("_"," ")}`;
  const metrics=document.createElement("section");metrics.append(row("Target overlap",`${intelligence.targetOverlap.count}/${intelligence.targetOverlap.total}`),row("Recency",String(intelligence.recency)),row("Trend",String(intelligence.trend)),row("Frequency",String(intelligence.frequency)));
  if(intelligence.revisionDueAt) metrics.append(row("Next revision",new Date(intelligence.revisionDueAt).toLocaleDateString()));
  const reasonsTitle=document.createElement("p");reasonsTitle.className="eyebrow";reasonsTitle.textContent="Why it matters";
  const reasons=document.createElement("div");reasons.className="chips";for(const reason of intelligence.priority.reasons.slice(0,6)){const chip=document.createElement("span");chip.textContent=reason.code.replaceAll("-"," ");reasons.append(chip);}

  const planTitle=document.createElement("p");planTitle.className="eyebrow";planTitle.textContent="Interview plan";
  const planSection=document.createElement("section");
  if(plan){
    planSection.append(row(plan.definition.name,plan.adaptive.daysRemaining==null?"Active":`${plan.adaptive.daysRemaining}d`));
    planSection.append(row("Today's queue",String(plan.adaptive.dailyQueue.length)));
    planSection.append(row("Weak topics",String(plan.adaptive.weakTopics.length)));
    if(plan.adaptive.dailyQueue.includes(problem.slug)) planSection.append(row("Current problem","In today's plan"));
  } else {
    const empty=document.createElement("p");empty.textContent="Create a plan on the Leet Progress website to add interview context here.";planSection.append(empty);
  }

  const nextTitle=document.createElement("p");nextTitle.className="eyebrow";nextTitle.textContent="Recommended next";
  const next=document.createElement("section");for(const recommendation of recommendations.slice(0,5)){const item=document.createElement("div");item.className="metric";const left=document.createElement("span");left.textContent=recommendation.title;const right=document.createElement("strong");right.textContent=String(recommendation.priorityScore);item.title=recommendation.reasons.join(", ");item.append(left,right);next.append(item);}
  const listTitle=document.createElement("p");listTitle.className="eyebrow";listTitle.textContent="Companies";
  const list=document.createElement("div");list.className="chips";for(const company of companies.slice(0,20)){const chip=document.createElement("span");chip.textContent=company;list.append(chip);}
  root.append(eyebrow,h1,score,meta,metrics,reasonsTitle,reasons,planTitle,planSection,nextTitle,next,listTitle,list);
}
void refresh(); window.setInterval(()=>void refresh(),1000);
