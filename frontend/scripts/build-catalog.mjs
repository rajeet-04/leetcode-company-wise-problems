import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.cwd(), "..");
const out = path.resolve(process.cwd(), "src/data");

function parseCsv(text) {
  const rows = [];
  let row = [], field = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i], next = text[i + 1];
    if (c === '"' && quoted && next === '"') { field += '"'; i++; continue; }
    if (c === '"') { quoted = !quoted; continue; }
    if (c === "," && !quoted) { row.push(field); field = ""; continue; }
    if ((c === "\n" || c === "\r") && !quoted) {
      if (c === "\r" && next === "\n") i++;
      row.push(field); field = "";
      if (row.some(Boolean)) rows.push(row);
      row = []; continue;
    }
    field += c;
  }
  if (field || row.length) { row.push(field); if (row.some(Boolean)) rows.push(row); }
  if (!rows.length) return [];
  const headers = rows.shift().map((h) => h.trim());
  return rows.map((values) => Object.fromEntries(headers.map((h, i) => [h, (values[i] ?? "").trim()])));
}

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === "frontend" || entry.name === ".git" ? [] : walk(full);
    return entry.name.toLowerCase().endsWith(".csv") ? [full] : [];
  });
}

function periodOf(file) {
  const name = path.basename(file).toLowerCase();
  if (name.includes("thirty")) return "30d";
  if (name.includes("three months")) return "90d";
  if (name.includes("six months")) return "6m";
  return "all";
}

function slugOf(link, title) {
  const match = String(link || "").match(/\/problems\/([^/?#]+)/i);
  return (match?.[1] || title || "unknown").toLowerCase().trim();
}

function numberOf(link, title) {
  const match = String(link || "").match(/\/problems\/([^/?#]+)/i);
  return match ? "" : String(title || "");
}

const files = walk(root);
const merged = new Map();
let sourceRows = 0;
for (const file of files) {
  const company = path.basename(path.dirname(file));
  const period = periodOf(file);
  for (const row of parseCsv(fs.readFileSync(file, "utf8"))) {
    sourceRows++;
    const slug = slugOf(row.Link, row.Title);
    const key = slug || row.Title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const topics = String(row.Topics || "").split(",").map((x) => x.trim()).filter(Boolean);
    const item = merged.get(key) || { id: numberOf(row.Link, row.Title), title: row.Title, slug, url: row.Link, difficulty: row.Difficulty || "", frequency: row.Frequency || "", acceptanceRate: row["Acceptance Rate"] || "", companies: [], periods: [], topics: [], sources: [] };
    if (!item.title && row.Title) item.title = row.Title;
    if (!item.url && row.Link) item.url = row.Link;
    if (!item.difficulty && row.Difficulty) item.difficulty = row.Difficulty;
    if (!item.companies.includes(company)) item.companies.push(company);
    if (!item.periods.includes(period)) item.periods.push(period);
    for (const topic of topics) if (!item.topics.includes(topic)) item.topics.push(topic);
    item.sources.push({ company, period });
    merged.set(key, item);
  }
}
const records = [...merged.values()].map((item) => {
  item.companies.sort((a, b) => a.localeCompare(b));
  item.periods.sort(); item.topics.sort((a, b) => a.localeCompare(b));
  item.sources.sort((a, b) => `${a.company}-${a.period}`.localeCompare(`${b.company}-${b.period}`));
  return item;
}).sort((a, b) => a.title.localeCompare(b.title));
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, "catalog.json"), JSON.stringify(records));
fs.writeFileSync(path.join(out, "catalog-meta.json"), JSON.stringify({ sourceRows, uniqueProblems: records.length, mergedDuplicates: sourceRows - records.length, companies: new Set(records.flatMap((r) => r.companies)).size }, null, 2));
console.log(`Catalog: ${sourceRows} rows → ${records.length} problems`);
