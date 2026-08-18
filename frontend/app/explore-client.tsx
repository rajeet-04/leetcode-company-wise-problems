"use client";
import { useMemo, useState, type ReactNode } from "react";
import { problems, type Problem } from "@/src/data/catalog";
import { filterProblems, type Filters } from "@/src/lib/search";
import { ImportGuide } from "./import-guide";
import { MultiSelect } from "./multi-select";
import { useProgress } from "./progress-provider";
import { ThemeToggle } from "./theme-toggle";

const initial: Filters = {
  query: "",
  companies: [],
  difficulties: [],
  periods: [],
  solved: "all",
  sort: "relevance",
};

export default function Home() {
  const [filters, setFilters] = useState<Filters>(initial);
  const [detail, setDetail] = useState<Problem | null>(null);
  const [importing, setImporting] = useState(false);
  const { solved, toggleSolved, importSolved } = useProgress();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const companies = useMemo(
    () => [...new Set(problems.flatMap((p) => p.companies))].sort(),
    [],
  );
  const results = useMemo(
    () => filterProblems(problems, filters, solved),
    [filters, solved],
  );
  const resetKey = JSON.stringify(filters) + pageSize;
  const [lastResetKey, setLastResetKey] = useState(resetKey);
  if (resetKey !== lastResetKey) {
    setLastResetKey(resetKey);
    setPage(1);
  }
  const pageCount = Math.max(1, Math.ceil(results.length / pageSize));
  const pageResults = useMemo(
    () =>
      results.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize),
    [results, page, pageSize],
  );
  const update = (key: keyof Filters, value: string | string[]) =>
    setFilters((f) => ({ ...f, [key]: value }) as Filters);
  const toggle = (p: Problem) => toggleSolved(p.slug);
  return (
    <main className="min-h-screen bg-[#f7f7f5] text-[#171717]">
      <header className="mx-auto flex max-w-[1440px] items-center justify-between px-6 py-5 lg:px-10">
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-xl bg-[#171717] text-sm font-bold text-white">
            LP
          </span>
          <div>
            <p className="text-sm font-semibold">Leet Progress</p>
            <p className="text-[11px] text-black/45">
              Company intelligence for your prep
            </p>
          </div>
        </div>
        <div className="header-actions flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setImporting(true)}
            className="flex items-center gap-2 rounded-full bg-[#171717] px-4 py-2.5 text-xs font-semibold text-white transition active:scale-95"
          >
            Import from LeetCode <ExternalLinkIcon />
          </button>
        </div>
      </header>
      <section className="mx-auto max-w-[1440px] px-6 pb-8 pt-12 lg:px-10 lg:pt-16">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[.18em] text-[#6878e8]">
          The focused prep workspace
        </p>
        <h1 className="text-4xl font-semibold tracking-[-.055em] sm:text-6xl">
          Find the questions
          <br />
          <span className="text-black/35">worth your time.</span>
        </h1>
        <p className="mt-5 max-w-xl text-sm leading-6 text-black/55">
          Explore {problems.length.toLocaleString()} curated problems across{" "}
          {companies.length} companies. Search once, understand the overlap, and
          focus your next solve.
        </p>
      </section>
      <section className="mx-auto max-w-[1440px] px-6 lg:px-10">
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-black/10 bg-black/10 sm:grid-cols-4">
          <Stat label="Problems" value={problems.length} />
          <Stat label="Companies" value={companies.length} />
          <Stat label="Solved locally" value={solved.size} />
          <Stat label="Showing" value={results.length} />
        </div>
      </section>
      <section className="mx-auto max-w-[1440px] px-6 py-8 lg:px-10">
        <div className="rounded-2xl border border-black/10 bg-white/75 p-3 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <SearchIcon />
              <input
                value={filters.query}
                onChange={(e) => update("query", e.target.value)}
                placeholder="Search problems, topics, companies..."
                className="h-11 w-full rounded-xl bg-[#f4f4f2] pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-[#6878e8]"
              />
            </div>
            <MultiSelect
              values={filters.companies}
              onChange={(v) => update("companies", v)}
              label="All companies"
              options={companies}
            />
            <MultiSelect
              values={filters.difficulties}
              onChange={(v) => update("difficulties", v)}
              label="All difficulty"
              options={["EASY", "MEDIUM", "HARD"]}
            />
            <MultiSelect
              values={filters.periods}
              onChange={(v) => update("periods", v)}
              label="Any window"
              options={["30d", "90d", "6m", "all"]}
            />
            <Select
              value={filters.solved}
              onChange={(v) => update("solved", v)}
              label="All progress"
              options={["solved", "unsolved"]}
            />
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-[1440px] px-6 pb-20 lg:px-10">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-black/45">
          <span>{results.length.toLocaleString()} matching questions</span>
          <div className="flex items-center gap-2">
            <Select
              value={filters.sort}
              onChange={(v) => update("sort", v)}
              label="Sort: relevance"
              options={["title", "companies", "difficulty"]}
            />
            <Select
              value={String(pageSize)}
              onChange={(v) => setPageSize(Number(v))}
              label="Per page"
              options={["20", "50", "100"]}
            />
          </div>
        </div>
        <div className="overflow-hidden rounded-2xl border border-black/10 bg-white">
          {pageResults.map((p, i) => (
            <Row
              key={p.slug}
              p={p}
              solved={solved.has(p.slug)}
              onToggle={() => toggle(p)}
              onOpen={() => setDetail(p)}
              index={i}
            />
          ))}{" "}
          {!results.length && (
            <div className="px-6 py-20 text-center">
              <p className="font-semibold">No questions found</p>
              <p className="mt-2 text-sm text-black/45">
                Try a broader search or clear a filter.
              </p>
            </div>
          )}
        </div>
        {results.length > 0 && (
          <Pagination page={page} pageCount={pageCount} onChange={setPage} />
        )}
      </section>
      {detail && (
        <Detail
          p={detail}
          solved={solved.has(detail.slug)}
          onToggle={() => toggle(detail)}
          onClose={() => setDetail(null)}
        />
      )}{" "}
      {importing && (
        <ImportGuide
          onClose={() => setImporting(false)}
          onImport={(ids) => {
            importSolved(ids);
            setImporting(false);
          }}
        />
      )}
    </main>
  );
}
function Icon({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      className={`size-4 shrink-0 ${className}`}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      {children}
    </svg>
  );
}
function SearchIcon() {
  return (
    <Icon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-black/35">
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </Icon>
  );
}
function CheckIcon() {
  return (
    <Icon>
      <path d="m5 12 4 4L19 6" />
    </Icon>
  );
}
function ExternalLinkIcon() {
  return (
    <Icon>
      <path d="M14 5h5v5" />
      <path d="m19 5-8 8" />
      <path d="M18 13v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
    </Icon>
  );
}
function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <Icon>
      <path d={direction === "left" ? "m14 6-6 6 6 6" : "m10 6 6 6-6 6"} />
    </Icon>
  );
}
function MoreHorizontalIcon() {
  return (
    <Icon>
      <circle cx="5" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="19" cy="12" r="1" fill="currentColor" stroke="none" />
    </Icon>
  );
}
function CloseIcon() {
  return (
    <Icon>
      <path d="m6 6 12 12M18 6 6 18" />
    </Icon>
  );
}
function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white px-5 py-5">
      <p className="text-[11px] uppercase tracking-[.14em] text-black/40">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold">{value.toLocaleString()}</p>
    </div>
  );
}
function Select({
  value,
  onChange,
  label,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  options: string[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={label}
      className="h-11 min-w-[125px] rounded-xl bg-[#f4f4f2] px-3 text-xs font-medium text-black/65 outline-none focus:ring-2 focus:ring-[#6878e8]"
    >
      <option value="">{label}</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}
function Pagination({
  page,
  pageCount,
  onChange,
}: {
  page: number;
  pageCount: number;
  onChange: (p: number) => void;
}) {
  const nums = (() => {
    const span = 1;
    const set = new Set<number>([1, pageCount, page]);
    for (let i = page - span; i <= page + span; i++)
      if (i >= 1 && i <= pageCount) set.add(i);
    return [...set].sort((a, b) => a - b);
  })();
  return (
    <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5">
      <button
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page === 1}
        aria-label="Previous page"
        className="grid size-9 place-items-center rounded-xl border border-black/10 bg-white text-black/60 transition hover:border-[#6878e8] disabled:cursor-not-allowed disabled:opacity-35"
      >
        <ChevronIcon direction="left" />
      </button>
      {nums.map((n, i) => (
        <span key={n} className="flex items-center gap-1.5">
          {i > 0 && n - nums[i - 1] > 1 && (
            <span className="px-1 text-black/30">
              <MoreHorizontalIcon />
            </span>
          )}
          <button
            onClick={() => onChange(n)}
            aria-current={n === page}
            className={`grid size-9 place-items-center rounded-xl border text-xs font-semibold transition ${n === page ? "border-[#6878e8] bg-[#6878e8] text-white" : "border-black/10 bg-white text-black/60 hover:border-[#6878e8]"}`}
          >
            {n}
          </button>
        </span>
      ))}
      <button
        onClick={() => onChange(Math.min(pageCount, page + 1))}
        disabled={page === pageCount}
        aria-label="Next page"
        className="grid size-9 place-items-center rounded-xl border border-black/10 bg-white text-black/60 transition hover:border-[#6878e8] disabled:cursor-not-allowed disabled:opacity-35"
      >
        <ChevronIcon direction="right" />
      </button>
    </div>
  );
}
function Row({
  p,
  solved,
  onToggle,
  onOpen,
  index,
}: {
  p: Problem;
  solved: boolean;
  onToggle: () => void;
  onOpen: () => void;
  index: number;
}) {
  return (
    <div
      className="group flex items-center gap-4 border-b border-black/5 px-4 py-4 transition hover:bg-[#fafaf8] sm:px-5"
      style={{ animationDelay: `${Math.min(index, 12) * 18}ms` }}
    >
      <button
        onClick={onToggle}
        aria-label={
          solved ? `Mark ${p.title} unsolved` : `Mark ${p.title} solved`
        }
        className={`grid size-7 shrink-0 place-items-center rounded-full border transition active:scale-90 ${solved ? "border-[#6878e8] bg-[#6878e8] text-white" : "border-black/15 text-transparent hover:border-[#6878e8]"}`}
      >
        {solved && <CheckIcon />}
      </button>
      <button onClick={onOpen} className="min-w-0 flex-1 text-left">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate text-sm font-semibold group-hover:text-[#5364da]">
            {p.title}
          </span>
          <span
            className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${p.difficulty === "EASY" ? "bg-emerald-50 text-emerald-600" : p.difficulty === "HARD" ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-600"}`}
          >
            {p.difficulty || "—"}
          </span>
        </div>
        <p className="mt-1 truncate text-xs text-black/40">
          {p.companies.slice(0, 4).join(" · ")}
          {p.companies.length > 4 ? ` +${p.companies.length - 4}` : ""}
        </p>
      </button>
      <span className="hidden text-xs text-black/30 sm:block">
        {p.companies.length}{" "}
        {p.companies.length === 1 ? "company" : "companies"}
      </span>
      <a
        href={p.url}
        target="_blank"
        rel="noreferrer"
        aria-label={`Open ${p.title} on LeetCode`}
        className="hidden size-8 place-items-center text-black/30 hover:text-black sm:grid"
      >
        <ExternalLinkIcon />
      </a>
    </div>
  );
}
function Detail({
  p,
  solved,
  onToggle,
  onClose,
}: {
  p: Problem;
  solved: boolean;
  onToggle: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-20 grid place-items-end bg-black/20 p-3 backdrop-blur-sm sm:place-items-center">
      <div className="w-full max-w-xl rounded-3xl bg-[#fbfbf9] p-6 shadow-2xl">
        <div className="flex justify-between">
          <div>
            <p className="text-xs uppercase tracking-[.15em] text-black/40">
              Question detail
            </p>
            <h2 className="mt-2 text-2xl font-semibold">{p.title}</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close question detail"
            className="grid size-9 place-items-center text-black/35 hover:text-black"
          >
            <CloseIcon />
          </button>
        </div>
        <div className="mt-7 grid grid-cols-2 gap-3">
          {[
            ["Difficulty", p.difficulty],
            ["Companies", String(p.companies.length)],
            ["Windows", p.periods.join(", ")],
            ["Topics", String(p.topics.length)],
          ].map(([l, v]) => (
            <div key={l} className="rounded-xl bg-black/[.035] p-3">
              <p className="text-[10px] uppercase tracking-wider text-black/35">
                {l}
              </p>
              <p className="mt-1 text-sm font-medium">{v || "—"}</p>
            </div>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {p.companies.map((c) => (
            <span
              key={c}
              className="rounded-full bg-black/[.05] px-3 py-1.5 text-xs text-black/60"
            >
              {c}
            </span>
          ))}
        </div>
        <div className="mt-7 flex gap-3">
          <button
            onClick={onToggle}
            className="rounded-full bg-[#171717] px-4 py-2.5 text-xs font-semibold text-white"
          >
            {solved ? "Mark unsolved" : "Mark solved"}
          </button>
          <a
            href={p.url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 rounded-full border border-black/10 px-4 py-2.5 text-xs font-semibold"
          >
            Open on LeetCode <ExternalLinkIcon />
          </a>
        </div>
      </div>
    </div>
  );
}
