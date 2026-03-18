# Architecture

Status: Active
Last Updated: 2026-03-18
Canonical: Yes

## Stack

- Next.js (App Router)
- TypeScript
- MongoDB (Atlas)
- Vercel hosting

## High-Level Structure

- `src/app` - route segments, page composition, metadata
- `src/components` - reusable visual and interaction components
- `src/lib` - business logic, aggregation, adapters, integrations
- `public` - static assets and share images

## Core Data Flow

1. User votes via UI (`igen` / `nem`).
2. `VoteWidget` renders immediate feedback and starts optimistic cooldown behavior.
3. Vote API persists a scoped event to MongoDB.
4. Result aggregators in `src/lib/results.ts` compute:
   - scope totals,
   - history payloads,
   - dashboard city/county statistics,
   - seat estimation inputs.
5. Pages render aggregated data with ISR revalidation (`120s` on key analytics pages).

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

## Hero And Map System

The live app no longer uses a static hero image as the primary public hero.

Current model:
- shared hero is rendered by `src/components/PageChrome.tsx`
- hero content is implemented by `src/components/CountyHeroMap.tsx`
- hero uses county-level result colors
- hero remains interactive and navigates to county pages
- county-list pages do not repeat the same map directly below the hero

Canonical hero copy:
- `2026 április 12`
- `SZAVAZÁS`
- `Váltani akarsz? Vagy nem? Kattints!`

Detailed user-facing contract lives in `docs/WORKFLOWS.md`.

Navigation note:
- county list, county EVK list, and EVK vote pages are a three-step flow,
- route-level copy and back links should preserve that hierarchy explicitly.

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
  - contains staging/validation visuals before promotion to production dashboard, limited to preview-specific metrics and active-county coverage summaries

Reusable dashboard visual components:
- `src/components/dashboard/*`

Preview data builder:
- `src/lib/dashboardPreviewData.ts`
- shared ranking builder layer: `src/lib/dashboardDetailData.ts`

## Vote Interaction Architecture

Canonical implementation:
- client UI: `src/components/VoteWidget.tsx`
- warmup + vote endpoint: `src/app/api/vote/route.ts`
- actor/cooldown state: `src/lib/voteEngine.ts`
- aggregation payloads: `src/lib/results.ts`

Behavior summary:
- vote buttons render immediate visual feedback,
- a `HEAD /api/vote` warmup prefetches cooldown context for first-click responsiveness,
- cooldown is started optimistically on click,
- POST response reconciles optimistic state with server truth,
- flash state transitions into countdown state without a plain-label gap,
- auth/session reads are treated as sidecars and should not block the core vote/results experience,
- post-vote summary refresh failures should degrade to retryable inline messaging rather than a false negative vote failure,
- vote path should degrade gracefully if non-essential protection sidecars fail.

## Dashboard Data Builder Contract

Current shared ranking builder layer:
- `src/lib/dashboardDetailData.ts`

Responsibilities:
- county-enriched city ranking assembly,
- balanced county aggregation,
- bloc-specific city ranking pagination for `/dashboard/igen` and `/dashboard/nem`,
- top dashboard ranking slices reused by production dashboard and preview,
- development-time county identity assertions,
- canonical county identity propagation via `countyCode` and `countyHref`,
- pure builder helpers used by regression tests.

Current direction:
- `/dashboard` and `/dashboard-preview` should share ranking-builder contracts,
- preview should only own metrics that are genuinely preview-specific,
- ranking renderers should trust canonical builder ids instead of rebuilding county identity locally.

## Authentication / 3x Voting Mode

- Auth/session endpoints under `/api/auth/*`
- Vote mode/weight behavior is reflected in aggregation and charts
- UI includes trust-first communication around login usage
- Google login is a sidecar capability for 3x voting mode, not a prerequisite for ordinary voting

## Styling System

- Global design tokens and component styles in `src/app/globals.css`
- Design rule: new visual modules should use global classes, not inline style definitions
- KPI/Card system is centralized and reusable:
  - `.kpi-card`, `.kpi-value-chip`, `.kpi-dual-chip`
  - `.chart-card`, `.pie-card`
  - collectible cards under `.preview-*`

The active design-system contract is documented in `docs/DESIGN_SYSTEM.md`.
