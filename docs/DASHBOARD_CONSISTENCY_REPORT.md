# Dashboard Consistency Report

Date: 2026-03-16
Scope: `/dashboard`, `/dashboard-preview`, dashboard card data builders, county/city card map rendering

## Executive Summary

The dashboard inconsistencies are not random visual bugs. They come from a small number of structural faults in the data-to-card pipeline.

The most severe issue was a broken county-route parser that mapped many EVK URLs to the wrong county code. That fault contaminated:
- county links,
- county lead colors,
- county silhouettes on city cards,
- county aggregation used by dashboard and preview cards.

That root cause is now fixed.

## Confirmed Root Cause Fixed

### RC-1. County code parser used the wrong path segment

Broken logic:
- `src/lib/territoryPaths.ts`
- constituency URLs such as `/ogy2026/egyeni-valasztokeruletek/07/01` were parsed as county `01` instead of `07`

Examples before fix:
- `/ogy2026/egyeni-valasztokeruletek/07/01` -> `01`
- `/ogy2026/egyeni-valasztokeruletek/14/11` -> `11`

Impact:
- Budapest, Fejér, Békés and other counties could be cross-wired
- county cards could show the wrong title-to-map combination
- county links could redirect to the wrong county
- county tone on city cards could be wrong because the wrong county aggregate was used

Status:
- fixed in `src/lib/territoryPaths.ts`

## Confirmed Downstream Symptoms Explained By RC-1

1. Multiple `Budapest főváros` cards appearing where only one county card should exist
2. `Budapest főváros` cards redirecting to non-Budapest county pages
3. City cards showing a county silhouette that does not match the title county
4. County lead chip / county tone inconsistencies on collectible ranking cards

## Additional Structural Weaknesses Still Present

### A-1. Dashboard card data shaping is duplicated

Affected files:
- `src/app/dashboard/page.tsx`
- `src/lib/dashboardPreviewData.ts`

Problem:
- Several sections build card payloads independently from the same base `CityVoteStat[]` dataset.
- Similar county aggregation and county lead enrichment logic exists in more than one place.

Risk:
- One route can be corrected while the other still computes stale or mismatched card props.

### A-2. Card renderers still accept both `countyName` and `countyCode`

Affected files:
- `src/components/dashboard/CityRankingCard.tsx`
- `src/components/dashboard/CountyRankingCard.tsx`

Problem:
- The renderer receives multiple county identity fields.
- When they diverge, the UI can show a valid title with an invalid shape or link.

Mitigation already added:
- map stamp now resolves county identity canonically from county name first

Remaining risk:
- data payloads can still carry mismatched county fields unless we reduce the contract to one canonical identifier.

### A-3. No invariant checks for dashboard card payload integrity

Problem:
- There is no validation step asserting that:
  - county name matches county code,
  - county href matches county code,
  - county silhouette source matches canonical county identity,
  - county aggregations are unique by county.

Risk:
- Data corruption becomes visible only in the UI.

### A-4. Dashboard and preview still own overlapping aggregation logic

Problem:
- We improved shared helpers, but route-local assembly still exists.
- That increases the chance of future drift in sorting, county enrichment, or card linking.

## What Was Fixed In This Batch

- Corrected county parsing in `src/lib/territoryPaths.ts`
- Restored canonical county lookup path for dashboard card rendering
- Verified build and style checks after the parser correction

## Files Involved In The Dashboard Fault Line

- `src/lib/territoryPaths.ts`
- `src/app/dashboard/page.tsx`
- `src/lib/dashboardPreviewData.ts`
- `src/components/dashboard/CityRankingCard.tsx`
- `src/components/dashboard/CountyRankingCard.tsx`
- `src/lib/constituencies.ts`
- `src/lib/hungaryCountyMap.ts`

## Current Assessment

The single parser bug explains the screenshoted Budapest/Fejér/Békés mismatch. However, the dashboard architecture still needs one more cleanup phase to eliminate the class of bug fully instead of only the current instance.
