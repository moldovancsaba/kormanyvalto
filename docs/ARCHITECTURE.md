# Architecture

## Stack

- Next.js (App Router)
- TypeScript
- MongoDB (Atlas)
- Vercel hosting

## High-Level Structure

- `src/app` - route segments, page composition, metadata
- `src/components` - reusable visual and interaction components
- `src/lib` - business logic, aggregation, adapters, integrations
- `public` - static assets (hero, social share images, map SVG datasets)

## Core Data Flow

1. User votes via UI (`igen` / `nem`).
2. Vote API persists a scoped event to MongoDB.
3. Result aggregators in `src/lib/results.ts` compute:
   - scope totals,
   - history payloads,
   - dashboard city/county statistics,
   - seat estimation inputs.
4. Pages render aggregated data with ISR revalidation (`120s` on key analytics pages).

## Scope Model

Primary scopes:
- `main` (national)
- `ogy2026/egyeni-valasztokeruletek/[maz]`
- `ogy2026/egyeni-valasztokeruletek/[maz]/[evk]`

## Shared Domain Helpers

- `src/lib/numberFormat.ts` - canonical number/percent/chip formatting
- `src/lib/matrixStatus.ts` - canonical national vote vs projected-outcome matrix text
- `src/lib/territoryPaths.ts` - canonical county code/href derivation from constituency routes
- `src/lib/svgPath.ts` - shared SVG path-bound calculation for map/card stamps

## Map System

Generic engine:
- `src/lib/svgRegionMap.ts`

Hungary adapter:
- `src/lib/hungaryCountyMap.ts`

Design:
- adapter defines dataset paths and region mapping,
- generic engine parses regions and computes viewBox from geometry bounds,
- deterministic fallback source is used for deploy/runtime resilience.

## Dashboard System

Production dashboard:
- `/dashboard`
  - includes production-ready ranking cards and shared KPI/pie cards

Preview dashboard:
- `/dashboard-preview`
  - contains staging/validation visuals before promotion to production dashboard, while reusing the shared KPI/pie primitives where behavior matches

Reusable dashboard visual components:
- `src/components/dashboard/*`

Preview data builder:
- `src/lib/dashboardPreviewData.ts`

## Authentication / 3x Voting Mode

- Auth/session endpoints under `/api/auth/*`
- Vote mode/weight behavior is reflected in aggregation and charts
- UI includes trust-first communication around login usage

## Styling System

- Global design tokens and component styles in `src/app/globals.css`
- Design rule: new visual modules should use global classes, not inline style definitions
- KPI/Card system is centralized and reusable:
  - `.kpi-card`, `.kpi-value-chip`, `.kpi-dual-chip`
  - `.chart-card`, `.pie-card`
  - collectible cards under `.preview-*`
