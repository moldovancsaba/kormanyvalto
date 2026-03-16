# Development Guide

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
npm run check:styles
```

Required before push to `main`:
- build must pass,
- style check must pass,
- major user-facing changes must update docs,
- release-impacting changes must bump `package.json` version and add a `docs/CHANGELOG.md` entry,
- preview visuals must follow interactive standards (`docs/KNOWLEDGE_BASE.md`).

## Code Conventions

- Reuse existing data builders in `src/lib/*`.
- Reuse shared UI modules in `src/components/*`.
- Keep visual rules in `src/app/globals.css`.
- Avoid hardcoded chart values.
- Avoid inline styling for new visual modules.
- Do not duplicate formatting helpers in route/component files.
- Do not parse county/district route data with ad-hoc `split()` logic when a shared helper exists.

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

## Recommended Commit Hygiene

- one logical change-set per commit
- concise imperative commit messages
- run build and style checks before push
