# Website Rework Agent Guide

## Scope

Rework the existing Leet Progress Next.js application at `https://leet-progress-eta.vercel.app/` into the planning/analysis client of the shared platform.

## Responsibilities

- preserve existing useful functionality during migration;
- consume shared packages for search, scoring, progress, recommendations, readiness, and analytics;
- provide web navigation and dashboards;
- persist personal state locally with IndexedDB through the shared storage interface;
- expose a narrow local bridge surface for the installed extension;
- provide backup/import/export UX;
- remove legacy Console/bookmarklet import only after extension import is stable.

## Non-goals

- Do not implement LeetCode DOM detection in the website.
- Do not create a cloud progress API or database.
- Do not duplicate shared scoring/recommendation/readiness calculations.

## UX role

The website is the planning and analysis environment. Optimize for exploration, comparison, plans, analytics, and long-form detail rather than mirroring the extension's compact UI.

## Safety during rework

- Migrate incrementally from the existing `frontend/` app.
- Preserve current local solved data before changing storage.
- Every route introduced must have keyboard-accessible navigation and meaningful empty/loading/error states.
- Website must remain usable when the extension is not installed.
- Extension connection must enhance local sync, never gate core website usage.
