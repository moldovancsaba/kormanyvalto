# Knowledge Base

## Dashboard Preview Standards

Status: Active (confirmed by product owner)

### Rule: All New Preview Visuals Must Be Fully Interactive

Applies to `/dashboard-preview` and any future preview/testing board.

Required:

- Every data point must be interactive.
- Every available entity link must be connected to the real destination page.
- Every row/item must expose clickable chips where applicable:
  - county chip (`vármegye`) -> county page
  - city chip (`város`) -> EVK page
  - district chip (`EVK`) -> EVK page
- No dead/static labels when a destination exists.
- Reusable component architecture only.
- No hardcoded data values.
- No in-code style (no inline style objects for new visual modules).

## KPI/Card Design Governance

Status: Active

Required:
- Use only global reusable card classes from `src/app/globals.css`.
- Do not create per-page hardcoded layout/spacing for card internals.
- Keep KPI headline values single-line.
- For large values, use compact numeric rendering (`K` / `M`).
- Ensure titles/subtitles use shared header structure (`.chart-card-head`) and stay visually aligned across sibling cards.
- Ensure content never overflows card boundaries.

Implementation notes:

- Use shared data builders under `src/lib/*`.
- Use shared visual components under `src/components/*`.
- Use global CSS classes in `src/app/globals.css`.
- Keep preview modules portable so they can be moved to `/dashboard` or `/mandatumbecsles` without rewrite.

## Map System Standards

- Use the generic SVG region map loader (`src/lib/svgRegionMap.ts`) for map datasets.
- Keep dataset adapters explicit (e.g. `src/lib/hungaryCountyMap.ts`).
- Avoid ambiguous naming and short/internal path aliases.
- Prefer deterministic fallback sources for deploy safety.

## Build And Delivery Gate

Before each push to `main`:

1. `npm run build` must pass.
2. New visuals must meet the interactive rule above.
3. Docs and version must be updated when behavior/architecture changes.
