# Consistency Remediation Plan

Date: 2026-03-16

## Goal

Bring the codebase back to one coherent architectural model:
- one rule per domain concern,
- one shared component per repeated visual pattern,
- one global formatting policy,
- no preview/production ownership drift,
- no route-string parsing scattered across pages.

## Phase 1. Shared Logic Stabilization

Status: in progress

Tasks:
- centralize all number/percent/chip formatting,
- centralize matrix-status rule,
- centralize county-code/county-href path helpers,
- centralize shared lead snapshot card,
- move production-shared dashboard components out of preview namespace.

Success criteria:
- no duplicate `formatNumber` / `formatPercent` implementations in `src`,
- no production imports from `src/components/dashboard-preview/*`,
- no duplicated matrix rule.

## Phase 2. Shared Visual Primitive Extraction

Tasks:
- extract shared KPI card component,
- extract shared pie/donut card component,
- replace page-local preview implementations,
- document visual primitive ownership.

Success criteria:
- no dashboard KPI/pie primitives defined inside route files,
- preview and production use the same card shells where behavior matches.

## Phase 3. Dashboard Data View-Model Layer

Tasks:
- create shared builders for city ranking cards,
- create shared builders for county ranking cards,
- eliminate repeated per-page mapping from `CityVoteStat[]` to card payloads,
- formalize the preview-only vs production-ready dataset boundary.

Success criteria:
- dashboard routes compose from typed view-model builders,
- route files focus on ordering/selection, not field reshaping.

## Phase 4. Naming and Ownership Cleanup

Tasks:
- ensure route names, component folders, and docs describe the same ownership model,
- remove obsolete preview-only aliases or stale docs references,
- standardize naming for cards, charts, and metrics.

Success criteria:
- docs, folders, and imports use one vocabulary,
- preview means preview, dashboard means shared/production.

## Phase 5. Style-System Audit Closure

Tasks:
- verify all charts/cards rely on global CSS classes only,
- audit remaining special-case classes for duplicated behavior,
- align spacing/headers/legend placement through shared card sections.

Success criteria:
- no inline styles,
- no route-local visual hacks,
- repeatable card grammar across pages.

## Phase 6. Repo Hygiene and Enforcement

Tasks:
- keep `.DS_Store` and similar artifacts out of source tree,
- keep `npm run check:styles` as required pre-push gate,
- optionally add a second audit script for duplicated local formatters/helpers.

Success criteria:
- style gate passes,
- repo remains free of OS junk files,
- new drift is caught early.

## Recommended Execution Order

1. finish Phase 1 fully,
2. extract KPI/pie primitives,
3. unify dashboard data builders,
4. complete naming/doc cleanup,
5. run final UX consistency pass.

## Immediate Next Fixes

1. Extract shared `KpiCard` and `PieCard` from route files.
2. Remove remaining preview-only architectural leakage from docs and route-local code.
3. Build a shared ranking-card dataset helper to remove repeated county aggregation logic.
4. Run another consistency sweep after those extractions and update the audit report.
