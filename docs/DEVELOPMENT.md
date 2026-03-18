# Development Guide

Status: Active
Last Updated: 2026-03-18
Canonical: Yes

## Core Rule

- User UX and user journey are the number 1 priority.
- This app is critical; core flows must continue working even when auxiliary systems fail.
- When designing security, telemetry, analytics, or preview-only features, default to graceful degradation on the critical user path.

## Prerequisites

- Node.js 18+
- npm 9+
- MongoDB Atlas connection string

## Install

```bash
npm install
```

## Environment

Create a local `.env.local` with at least:

```bash
MONGODB_URI=mongodb+srv://...
MONGODB_DB=kormanyvalto
```

If using 3x Google login mode locally, add the SSO/auth variables used by `/api/auth/*`.

## Run

```bash
npm run dev
```

Open:
- `http://localhost:3000`

## Build and Verification

```bash
npm run build
npm run lint
```

`npm run lint` is the primary verification gate and runs:
- `npm run typecheck`
- `npm run check:styles`
- `npm run test:dashboard`

The repository type-check uses `tsconfig.typecheck.json` so it does not depend on generated `.next/types` artifacts existing before a build.

Required before push to `main`:
- build must pass,
- style check must pass,
- major user-facing changes must update docs,
- release-impacting changes must bump `package.json` version and add a `docs/CHANGELOG.md` entry,
- preview visuals must follow interactive standards (`docs/KNOWLEDGE_BASE.md`).
- preview visuals must follow the active workflow and design-system contracts (`docs/WORKFLOWS.md`, `docs/DESIGN_SYSTEM.md`).
- critical user flows must not depend on optional sidecars for basic availability.

## Code Conventions

- Reuse existing data builders in `src/lib/*`.
- Reuse shared UI modules in `src/components/*`.
- Keep visual rules in `src/app/globals.css`.
- Avoid hardcoded chart values.
- Avoid inline styling for new visual modules.
- Do not duplicate formatting helpers in route/component files.
- Do not parse county/district route data with ad-hoc `split()` logic when a shared helper exists.

## Documentation Requirements

Documentation is mandatory.

If you change any of the following, update the matching source-of-truth doc in the same change-set:
- user-facing workflows: `docs/WORKFLOWS.md`
- design-system or shared visual behavior: `docs/DESIGN_SYSTEM.md`
- architecture or core data flow: `docs/ARCHITECTURE.md`
- operational behavior: `docs/OPERATIONS.md`
- security behavior: `docs/SECURITY.md`
- shipped release delta: `docs/CHANGELOG.md`

Examples:
- vote button UX or timing changes
- hero/map behavior changes
- dashboard ownership changes
- dashboard builder-layer ownership changes
- metadata/share-title changes
- degraded-mode reliability behavior

## Code Comment Standard

Comment non-obvious behavior, not syntax.

Required comment targets:
- state machines
- optimistic UI behavior
- fail-open / degraded-mode paths
- unusual data contracts
- cross-file coupling that is not obvious from names alone
- integrity assertions that are meant to catch drift before UI regressions ship

Avoid:
- comments that restate the next line
- vague comments like `ignore errors` without why that is safe
- stale comments that describe old behavior

## Shared Helpers

Prefer these shared helpers before writing local logic:

- `src/lib/numberFormat.ts`
  - `formatNumber()`
  - `formatPercent()`
  - `formatAbsolutePercent()`
  - `formatCompactChipNumber()`
- `src/lib/matrixStatus.ts`
  - `getMatrixStatus()`
- `src/lib/territoryPaths.ts`
  - `getCountyCodeFromConstituencyHref()`
  - `getCountyHrefFromConstituencyHref()`
- `src/lib/svgPath.ts`
  - `getSvgPathBounds()`

## KPI / Card Implementation Guide

When creating or changing KPI/cards, always compose from global classes:

- KPI card shell: `.kpi-card`
- KPI single value chip: `.kpi-value-chip` (+ tone variant such as `.kpi-value-chip-neutral`)
- KPI dual value chips: `.kpi-dual-stack`, `.kpi-dual-chip`, `.kpi-dual-chip-yes`, `.kpi-dual-chip-no`
- Shared header block: `.chart-card-head`
- Chart card shell: `.chart-card`
- Pie card shell: `.pie-card`

Value formatting:
- chip numbers use compact formatter (`K` / `M`) when the design calls for chip-based KPI values,
- standard labels/details use full `hu-HU` formatted numbers,
- single-value chips must stay on one line (no wrapped numbers),
- descriptive text belongs in `.kpi-detail` or header subtitle.

Overflow handling:
- card content must stay inside container,
- prefer global CSS rules (`overflow`, `word-break`, `overflow-wrap`) over per-component custom hacks.

## Preview Visual Delivery Rules

For `/dashboard-preview`:
- only unpublished / experimental modules belong there,
- every data point clickable when destination exists,
- county/city/EVK chips linked where available,
- portable components so visuals can move into production pages without rewrite.

## Active References

- runtime workflows: `docs/WORKFLOWS.md`
- design-system contracts: `docs/DESIGN_SYSTEM.md`

## Recommended Commit Hygiene

- one logical change-set per commit
- concise imperative commit messages
- run build and style checks before push
