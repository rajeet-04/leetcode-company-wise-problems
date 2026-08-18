# Phase 04 — Website Rework Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rework the existing Next.js single-page experience into a durable product shell with Today, Explore, Companies, Topics, Plans, Insights, problem, and company route boundaries while preserving verified local progress behavior.

**Architecture:** Keep domain calculations in shared packages and local persistence in the Phase 03 progress provider. Introduce a shared application shell/nav in `frontend/app`, move the existing explorer to `/explore`, and add route-level foundation views that consume existing catalog/progress data without inventing later-phase business logic.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind 4, TypeScript, shared workspace packages.

**Spec:** `docs/agentic/website/PLAN.md` Phase W2 and `docs/agentic/PLAN.md` Phase 4.

## Global Constraints

- User data remains local-only.
- Website must work without the extension installed.
- No duplicated scoring/recommendation/readiness logic in route components.
- Existing Explore filtering, progress toggles, importer, typecheck, and build must remain functional.
- Legacy Console importer remains available until the extension importer is proven stable.

---

### Task 1: Shared application shell

**Files:**
- Create: `frontend/app/app-shell.tsx`
- Modify: `frontend/app/layout.tsx`

**Interfaces:**
- Produces: `AppShell({ children })` with responsive navigation for `/`, `/explore`, `/companies`, `/topics`, `/plans`, `/insights`.

- [ ] Implement semantic navigation with active-route state from `usePathname`.
- [ ] Keep theme toggle and product identity in the shell.
- [ ] Wrap all pages inside `ProgressProvider` then `AppShell`.
- [ ] Verify keyboard navigation and no nested interactive controls.

### Task 2: Move current explorer to `/explore`

**Files:**
- Create: `frontend/app/explore/page.tsx`
- Create: `frontend/app/explore/explore-client.tsx`
- Modify: `frontend/app/page.tsx`

**Interfaces:**
- `/explore` preserves existing filtering, pagination, detail modal, solved toggles, and legacy importer.
- `/` becomes the Today foundation route.

- [ ] Move the existing client explorer without changing filtering logic.
- [ ] Remove duplicate product header from the explorer because the shell owns global navigation.
- [ ] Keep importer accessible from Explore.
- [ ] Add Today foundation content based only on local solved count/catalog counts.

### Task 3: Add primary destination routes

**Files:**
- Create: `frontend/app/companies/page.tsx`
- Create: `frontend/app/topics/page.tsx`
- Create: `frontend/app/plans/page.tsx`
- Create: `frontend/app/insights/page.tsx`

**Interfaces:**
- Each route renders a real foundation view with product-purpose copy and existing catalog/progress facts only.
- Do not implement recommendation/readiness formulas that belong to later phases.

### Task 4: Add canonical problem/company route boundaries

**Files:**
- Create: `frontend/app/problems/[slug]/page.tsx`
- Create: `frontend/app/companies/[company]/page.tsx`

**Interfaces:**
- Problem route resolves the existing compatibility catalog by slug and renders title, difficulty, companies, periods, topics, and LeetCode link.
- Company route resolves exact decoded company name and displays matching problem count plus links into Explore search.
- Unknown entities use `notFound()`.

### Task 5: Verification

Run fresh on the exact branch head:

```bash
bun install --frozen-lockfile
bun run test
cd frontend
bunx next typegen
bun run typecheck
bun run build
```

Also verify generated route list includes `/`, `/explore`, `/companies`, `/topics`, `/plans`, `/insights`, `/problems/[slug]`, `/companies/[company]`.

**Phase exit gate:** All routes render through one navigation shell, existing Explore behavior remains intact, shared tests pass, frontend typecheck/build pass, and no new user-data network path exists.
