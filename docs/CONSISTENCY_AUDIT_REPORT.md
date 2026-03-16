# Consistency Audit Report

Date: 2026-03-16
Scope: code structure, shared logic, naming, styling rules, repo hygiene, dashboard/preview architecture

## Executive Summary

The codebase is functional, but it contains clear architectural drift. The highest-impact inconsistencies were not visual defects by themselves, but duplicated business/UI logic that had already started to diverge across routes.

This audit found four primary problem classes:

1. duplicated formatting and status logic,
2. preview/production ownership drift,
3. brittle route-string parsing for county extraction,
4. repository hygiene and documentation mismatch.

A first remediation pass is already complete in code.

## Findings

### P1. Lead snapshot logic was duplicated and already drifting

Affected files:
- `src/components/VoteWidget.tsx`
- `src/components/dashboard-preview/LeadOverviewCard.tsx` (before refactor)
- `src/app/dashboard-preview/page.tsx`

Problem:
- The `Pillanatkép` card existed in separate implementations.
- The home page version had linked chips and updated behavior.
- The preview version had different rendering and separate formatting.

Risk:
- Every future visual or text change had to be applied in multiple places.
- Production and preview could show different logic for the same state.

Status:
- Fixed in this pass by introducing shared `src/components/dashboard/LeadOverviewCard.tsx`.

### P1. Number and percent formatting rules were duplicated across pages/components

Affected files included:
- `src/components/VoteWidget.tsx`
- `src/app/dashboard/page.tsx`
- `src/app/dashboard-preview/page.tsx`
- `src/app/mandatumbecsles/page.tsx`
- `src/components/dashboard/CityRankingCard.tsx`
- `src/components/dashboard/CountyRankingCard.tsx`
- `src/components/dashboard/ReportingCoverageCard.tsx`
- `src/components/CityBlocGridClient.tsx`

Problem:
- `formatNumber` and `formatPercent` existed in multiple local copies.
- This had already caused formatting policy drift in chips vs labels vs card details.

Risk:
- Inconsistent number display, repeated bugs, and more UI regressions when formatting policy changes.

Status:
- Partially fixed in this pass by centralizing shared helpers in `src/lib/numberFormat.ts` and migrating audited components/pages.

### P1. Preview components were serving production pages

Affected files:
- `src/app/dashboard/page.tsx`
- old component path `src/components/dashboard-preview/*`

Problem:
- Production `/dashboard` imported components from a `dashboard-preview` directory.
- Component ownership did not match route responsibility.

Risk:
- Naming drift, documentation drift, and accidental production regressions when preview-only work changes those files.

Status:
- Fixed in this pass by moving production-shared cards into `src/components/dashboard/*`.

### P1. Matrix-status rule existed in multiple implementations

Affected files:
- `src/app/api/results/route.ts`
- `src/lib/dashboardPreviewData.ts`

Problem:
- The same vote-lead / projected-outcome matrix rule was implemented twice.
- The API copy and analytics copy did not return identical messaging.

Risk:
- Main page and analytics surfaces could describe the same state differently.

Status:
- Fixed in this pass by centralizing the rule in `src/lib/matrixStatus.ts`.

### P2. County extraction relied on brittle string-splitting

Affected files:
- `src/app/dashboard/page.tsx`
- `src/lib/dashboardPreviewData.ts`

Problem:
- County code was repeatedly derived with `item.href.split("/")[3]`.

Risk:
- One route shape change would silently break multiple analytics sections.
- Repeated string parsing is harder to audit than a single helper.

Status:
- Fixed in this pass with `src/lib/territoryPaths.ts`.

### P2. SVG geometry parsing logic was duplicated

Affected files:
- `src/components/dashboard/CityRankingCard.tsx`
- `src/components/dashboard/CountyRankingCard.tsx`

Problem:
- Identical `getPathBounds` logic existed in multiple components.

Risk:
- Divergent geometry behavior and repeated maintenance cost.

Status:
- Fixed in this pass with `src/lib/svgPath.ts`.

### P2. Repository hygiene issue: `.DS_Store` files in source tree

Affected paths:
- `src/.DS_Store`
- `src/app/.DS_Store`
- `src/components/.DS_Store`

Problem:
- OS metadata files were present in source directories.

Risk:
- Unnecessary repository noise and avoidable platform-specific artifacts.

Status:
- Removed in this pass.

### P2. Documentation no longer matched the actual dashboard component layout

Affected files:
- `docs/ARCHITECTURE.md`
- `docs/DEVELOPMENT.md`

Problem:
- Docs still described `src/components/dashboard-preview/*` as the reusable visual component location.

Risk:
- Wrong guidance for future work and more inconsistency introduced by contributors.

Status:
- Fixed in this pass.

### P3. Preview route still contains local KPI/pie implementations

Affected file:
- `src/app/dashboard-preview/page.tsx`

Problem:
- `KpiCard` and `PieCard` remain page-local in preview.

Risk:
- If promoted without extraction, the same drift pattern will happen again.

Status:
- Not fixed yet. Kept as the next remediation step because it is lower risk than the shared logic issues above.

## Completed Remediation In This Pass

- Centralized number formatting in `src/lib/numberFormat.ts`
- Centralized matrix-status logic in `src/lib/matrixStatus.ts`
- Centralized county path parsing in `src/lib/territoryPaths.ts`
- Centralized SVG path-bound calculation in `src/lib/svgPath.ts`
- Replaced duplicated home/preview lead snapshot with shared `src/components/dashboard/LeadOverviewCard.tsx`
- Moved shared dashboard cards into `src/components/dashboard/*`
- Removed source-tree `.DS_Store` artifacts
- Updated docs to match the new component ownership

## Remaining Risk Areas

- preview-only KPI/pie visual primitives still need extraction,
- dashboard data shaping still duplicates several list-building patterns,
- chart/card datasets should move toward a typed shared view-model layer instead of route-local mapping.
