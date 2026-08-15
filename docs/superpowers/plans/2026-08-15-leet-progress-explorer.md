# Leet Progress Explorer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Next.js TypeScript/Tailwind explorer for all company CSV data, merging duplicate LeetCode questions across folder-named companies, with a local-only LeetCode solved-progress importer.

**Architecture:** A Node JavaScript parser runs during build to recursively read the repository CSVs and generate one deterministic normalized catalog. Next.js serves the static shell while a client-side explorer handles search/filter/sort and IndexedDB-backed progress. A replaceable connector module handles the user-triggered LeetCode same-origin bridge and nonce-validated `postMessage` transfer.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind CSS, Anime.js, IndexedDB via `idb`, Vitest, Testing Library, Playwright.

## Global Constraints

- Keep the main app client-side for user data and progress.
- Do not create a backend proxy for LeetCode.
- Do not collect, store, or transmit LeetCode cookies, session tokens, passwords, or authorization values.
- Company names come from CSV parent folder names and are preserved exactly in display data.
- Merge duplicate questions by canonical LeetCode slug, falling back to normalized title.
- Persist imported progress only in IndexedDB.
- Respect `prefers-reduced-motion` and keep motion brief and interruptible.
- Isolate LeetCode integration behind an adapter interface.

## File Map

- Create `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `tailwind.config.ts`, `vitest.config.ts`.
- Create `scripts/build-catalog.mjs` for CSV parsing and catalog generation.
- Create `src/lib/catalog/types.ts`, `src/lib/catalog/parser.ts`, `src/lib/catalog/merge.ts`, `src/lib/catalog/search.ts`.
- Create generated `src/data/catalog.json` and `src/data/catalog-meta.json`.
- Create `src/lib/storage/progress-db.ts` and `src/lib/storage/progress-store.ts`.
- Create `src/lib/leetcode/types.ts`, `src/lib/leetcode/connector.ts`, `src/lib/leetcode/message-validation.ts`, `public/leetcode-connector.bookmarklet.js`.
- Create `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`, `src/app/error.tsx`.
- Create focused UI components under `src/components/`: `app-shell`, `topbar`, `overview-strip`, `search-controls`, `filter-drawer`, `problem-results`, `problem-row`, `progress-panel`, `import-dialog`, `empty-state`, `motion-number`.
- Create tests under `tests/catalog`, `tests/search`, `tests/storage`, `tests/leetcode`, and `tests/components`.

### Task 1: Scaffold the Next.js application

**Files:** project configuration files and `src/app/layout.tsx`, `src/app/globals.css`.

- [ ] Create the Next.js App Router TypeScript project files and scripts: `dev`, `build`, `start`, `lint`, `typecheck`, `test`, and `catalog`.
- [ ] Enable `cacheComponents: true` in `next.config.ts`; keep browser-only APIs out of Server Components.
- [ ] Add Tailwind with CSS variables for canvas, ink, muted text, borders, accent, success, warning, and difficulty colors.
- [ ] Add optimized font loading and metadata for “Leet Progress”.
- [ ] Add baseline focus-visible styles, reduced-motion CSS, responsive container utilities, and selection styling.
- [ ] Run `npm install`, `npm run typecheck`, and `npm run build`; fix only scaffold errors.
- [ ] Commit `chore: scaffold next app shell`.

### Task 2: Implement CSV parser and canonical merge

**Files:** `scripts/build-catalog.mjs`, `src/lib/catalog/types.ts`, `src/lib/catalog/parser.ts`, `src/lib/catalog/merge.ts`, `tests/catalog/parser.test.ts`.

**Interfaces:** `parseCsv(text: string): CsvRow[]`; `parsePeriod(filename: string): Period`; `canonicalProblemKey(row: RawProblemRow): string`; `mergeProblemRows(rows: RawProblemRow[]): ProblemRecord[]`.

- [ ] Write tests for quoted topics, commas in fields, missing values, filename period extraction, folder-name company extraction, slug identity, title fallback, and duplicate merging.
- [ ] Run `npm test -- tests/catalog/parser.test.ts`; confirm the new tests fail before implementation.
- [ ] Implement a small quoted-CSV parser without adding a runtime dependency; trim headers/values while retaining exact company display names.
- [ ] Extract company from the immediate parent folder and map filenames to `30d`, `90d`, `6m`, or `all`.
- [ ] Normalize LeetCode URLs and slugs; use slug as identity and normalized title only when slug is absent.
- [ ] Merge duplicate records by key, union exact company names, periods, topics, and source references, and choose non-empty canonical values deterministically.
- [ ] Run parser tests and confirm they pass.
- [ ] Commit `feat: add merged csv catalog parser`.

### Task 3: Generate and validate the catalog artifact

**Files:** `scripts/build-catalog.mjs`, `src/data/catalog.json`, `src/data/catalog-meta.json`, `tests/catalog/generate-catalog.test.ts`.

- [ ] Add a test fixture covering the same question in two company folders and multiple periods.
- [ ] Implement recursive discovery of `*.csv` while excluding `.git`, `.next`, `node_modules`, and generated output.
- [ ] Generate deterministic records sorted by numeric problem ID when available, then slug/title; sort company, period, topic, and source arrays.
- [ ] Emit metadata containing source row count, unique problem count, merged duplicate count, company count, and generation version.
- [ ] Run `npm run catalog`, inspect duplicate company output, and run catalog validation tests.
- [ ] Commit `build: generate normalized problem catalog`.

### Task 4: Implement explorer query state and search

**Files:** `src/lib/catalog/search.ts`, `src/lib/catalog/types.ts`, `tests/search/search.test.ts`.

**Interfaces:** `SearchState`; `filterAndSortProblems(records: ProblemRecord[], state: SearchState, solvedIds: Set<string>): ProblemRecord[]`.

- [ ] Write tests for title/slug/company/topic fuzzy matching, exact numeric IDs, multiple companies, difficulty, period, topic, solved state, and each supported sort.
- [ ] Run search tests and confirm failure.
- [ ] Implement normalized token matching with a simple relevance score, preserving exact title/ID matches ahead of loose matches.
- [ ] Implement stable sorting and deterministic tie-breakers.
- [ ] Add URL encode/decode helpers for query, filters, sort, and page state.
- [ ] Run search tests and commit `feat: add explorer search and filters`.

### Task 5: Add IndexedDB progress storage

**Files:** `src/lib/storage/progress-db.ts`, `src/lib/storage/progress-store.ts`, `tests/storage/progress-store.test.ts`.

**Interfaces:** `saveSolvedProblems(problems: SolvedProblem[]): Promise<void>`; `loadSolvedProblems(): Promise<SolvedProblem[]>`; `clearSolvedProblems(): Promise<void>`.

- [ ] Write tests for upsert/deduplication by ID or slug, load, clear, and malformed record rejection.
- [ ] Implement an IndexedDB database with a `solvedProblems` object store and indexes for slug and imported timestamp.
- [ ] Keep storage calls browser-only and expose a React-friendly load/save/clear wrapper.
- [ ] Run storage tests and commit `feat: persist local solved progress`.

### Task 6: Implement the LeetCode connector adapter

**Files:** `src/lib/leetcode/types.ts`, `src/lib/leetcode/connector.ts`, `src/lib/leetcode/message-validation.ts`, `public/leetcode-connector.bookmarklet.js`, `tests/leetcode/*.test.ts`.

- [ ] Write tests for paginated page collection, solved filtering, duplicate removal, GraphQL errors, HTTP errors, missing result schema, wrong origin, wrong nonce, wrong version, and malformed problem payloads.
- [ ] Implement `ProgressConnector` and a `fetchProgressPage(fetcher, skip, limit)` adapter using `/graphql/`, `userProgressQuestionList`, and `credentials: include` only inside the LeetCode-side connector.
- [ ] Implement pagination until `totalNum`, with an empty-page escape hatch and strict response validation.
- [ ] Implement the bookmarklet script to run only on LeetCode, send minimal `{ id, title, slug }` records, use the exact app origin, and never access cookies directly.
- [ ] Implement nonce generation and message validation in the app.
- [ ] Run connector tests and commit `feat: add secure leetcode progress bridge`.

### Task 7: Build the explorer UI

**Files:** `src/app/page.tsx`, `src/components/*`, `src/app/globals.css`.

- [ ] Add a client app shell with navigation, overview metrics, search controls, filter drawer, result list, and responsive empty states.
- [ ] Add multi-company, difficulty, period, topic, solved, and sort controls with accessible labels and keyboard operation.
- [ ] Add expandable problem rows showing merged company names, source periods, topics, frequency, acceptance rate, and LeetCode link.
- [ ] Add result virtualization only if the catalog size causes measurable render cost; keep initial implementation simple and paginated/windowed.
- [ ] Add Anime.js micro-animations for count changes, filter transitions, row entry, and import status; disable nonessential animation for reduced-motion users.
- [ ] Add component tests for filter interaction, result rendering, solved indicators, and empty states.
- [ ] Commit `feat: add searchable company problem explorer`.

### Task 8: Build the local progress and import UX

**Files:** `src/components/progress-panel.tsx`, `src/components/import-dialog.tsx`, `src/lib/leetcode/*`, `src/app/page.tsx`.

- [ ] Add progress summary, solved percentage, company coverage, last import time, and clear-local-data action.
- [ ] Add import instructions using plain language: open LeetCode, run connector, return to the app.
- [ ] Generate a one-time nonce, open/focus LeetCode, listen for the exact expected origin, validate nonce/schema, save validated records, and remove the listener after success/failure.
- [ ] Add actionable states for not logged in, network failure, GraphQL failure, changed schema, missing opener, malformed message, and IndexedDB failure.
- [ ] Add tests for successful import and each user-visible error state.
- [ ] Commit `feat: add local leetcode import flow`.

### Task 9: Accessibility, responsive polish, and visual QA

**Files:** `src/app/globals.css`, affected components, `README.md`.

- [ ] Verify keyboard navigation, focus order, dialog escape behavior, screen-reader labels, contrast, reduced motion, and mobile filter access.
- [ ] Add responsive layouts for narrow mobile, tablet, and desktop widths.
- [ ] Add README instructions for development, catalog generation, deployment, and bookmarklet setup.
- [ ] Run lint, typecheck, unit tests, and production build.
- [ ] Run browser smoke tests for search, filtering, URL state, local progress persistence, and import message validation.
- [ ] Commit `docs: document explorer and local import workflow`.

### Task 10: Final verification

- [ ] Run `npm run catalog` and verify the generated metadata matches the repository's source counts.
- [ ] Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.
- [ ] Inspect `git diff --check` and `git status --short`.
- [ ] Confirm no code reads cookie values, sends credentials to the app origin, or adds a LeetCode backend route.
- [ ] Perform a final browser pass and record any known limitation from LeetCode's undocumented GraphQL contract.
