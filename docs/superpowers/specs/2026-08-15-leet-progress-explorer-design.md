# Leet Progress Explorer Design

## Goal

Build a Next.js App Router application with TypeScript and Tailwind that provides a fast, professional explorer for the repository's company-wise LeetCode CSV data and a privacy-first local LeetCode progress importer.

## Architecture

- Next.js App Router with a mostly client-side interactive shell.
- `cacheComponents: true` for static shell/content that benefits from build-time caching; no user progress is server-cached.
- A JavaScript build parser reads all company CSV files and generates one normalized catalog artifact.
- The browser uses the generated catalog for search and filtering.
- Imported LeetCode progress is stored only in IndexedDB.
- No backend proxy, LeetCode credentials, cookies, or raw authenticated responses are collected.

## CSV normalization and duplicate merging

The parser will recursively inspect all company directories and CSV files. It will parse quoted CSV fields safely, normalize headers and values, and derive:

- company from the containing directory;
- period from the filename (`30d`, `90d`, `6m`, or `all`);
- canonical problem identity from the LeetCode URL slug, falling back to normalized title if necessary.

Duplicate rows for the same canonical problem will become one record. The merged record will:

- keep one canonical title, slug, URL, difficulty, frequency, acceptance rate, and topic set;
- union all company names;
- union all source periods per company;
- union all topics;
- retain source metadata for traceability;
- tolerate minor differences between duplicate rows by preferring non-empty values and the most complete topic set.

The generated artifact will include deterministic ordering and a summary of source row count, unique problem count, company count, and merged duplicate count.

## Explorer experience

The main experience will include:

- company and problem overview metrics;
- global fuzzy search across title, ID, slug, companies, and topics;
- multi-select company filtering;
- difficulty, period, topic, and solved-state filters;
- sorting by title, problem number, difficulty, frequency, acceptance rate, company count, and solved state;
- URL-persisted search/filter state;
- responsive result table/list with LeetCode links;
- local progress-aware solved indicators;
- empty, loading, and error states.

## LeetCode import

The importer will be isolated behind a connector interface. A user-triggered bookmarklet/userscript runs on `leetcode.com`, calls the internal `userProgressQuestionList` GraphQL operation in same-origin context, paginates with `skip` and `limit`, filters `questionStatus === "SOLVED"`, and sends only minimal problem metadata back.

The app will create a one-time nonce, validate the exact message origin, nonce, version, and payload schema, then persist the validated records to IndexedDB. It will report login, network, GraphQL, schema, opener, and malformed-message failures in plain language.

## Visual system and motion

The UI will use a restrained near-white/dark-ink palette, compact typography, subtle borders, and limited translucent surfaces. Anime.js will provide short, interruptible micro-interactions for counts, filter changes, result entrances, and progress updates. Reduced-motion preferences will disable nonessential animation.

## Testing and verification

- Unit tests for CSV parsing, period extraction, URL/title identity, duplicate merging, and deterministic output.
- Tests for search/filter/sort behavior and message validation.
- IndexedDB mapping tests where browser test support is available.
- Type-check, lint, production build, and browser-level smoke verification.

## Scope boundary

The first release will not add accounts, server-side progress storage, a backend LeetCode proxy, or submission-code import.
