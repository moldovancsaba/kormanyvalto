# Kormanyvalto
Status: Active
Last Updated: 2026-03-18
Canonical: Yes
Owner: Product

<h1 align="center">Kormanyvalto</h1>
<p align="center"><strong>Election-style civic game platform for OGY 2026 simulation: országos, vármegyei, and EVK voting with analytics and mandate estimation.</strong></p>

<p align="center">
  <img src="https://img.shields.io/badge/version-v1.3.2-2563EB?style=for-the-badge" alt="Version">
  <img src="https://img.shields.io/badge/platform-Web%20App-0F172A?style=for-the-badge" alt="Platform">
  <img src="https://img.shields.io/badge/stack-Next.js%20%7C%20MongoDB-0EA5E9?style=for-the-badge" alt="Stack">
</p>

<p align="center">
  <a href="#product-overview">Product Overview</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#operations-and-validation">Operations & Validation</a> •
  <a href="#documentation-map">Documentation Map</a> •
  <a href="#handover-and-dev-notes">Handover & Dev Notes</a>
</p>

## Product Overview

`Kormanyvalto` is a Next.js + MongoDB platform where users can vote (`igen` / `nem`) at multiple scopes and view aggregated public mood and seat estimates.

Product priority:
- user UX and user journey are the number 1 priority,
- critical user flows must keep working even when secondary systems degrade,
- security, analytics, and anti-abuse layers must not break the main vote experience for normal users.

Core capabilities:
- National (`Országos`) vote stream and barometer
- Hierarchical election navigation (country -> county -> EVK)
- Scope-aware vote history and source labeling
- 3x authenticated mode with Google SSO flow
- Dashboard analytics and preview-first visual pipeline
- 199-seat mandate estimation (106 EVK + 93 list)
- County map visualization with reusable SVG region engine

Current delivery stage:
- core vote flow is implemented and live,
- county -> EVK -> vote navigation is implemented and live,
- 3x Google-authenticated mode is implemented as an optional sidecar,
- dashboard shared builder layer and regression coverage are implemented,
- mandate estimate route is implemented and live,
- current risk is documentation drift and final delivery hardening, not missing core user journeys.

## Main Routes

- `/` - national vote page
- `/dashboard` - production analytics dashboard (`Csataterek`, `Biztos bástyák`, county/city chart pack, KPI + pie)
- `/dashboard-preview` - preview board for unpublished dashboard modules and validation visuals
- `/mandatumbecsles` - mandate estimate and parliament visualization
- `/ogy2026/egyeni-valasztokeruletek` - county list below the shared interactive county-result hero
- `/ogy2026/egyeni-valasztokeruletek/[maz]` - county EVK list
- `/ogy2026/egyeni-valasztokeruletek/[maz]/[evk]` - EVK vote page

## Quick Start

```bash
npm install
npm run dev
```

Default local app:
- `http://localhost:3000`

## Environment

Required:

```bash
MONGODB_URI=mongodb+srv://...
```

Recommended:

```bash
MONGODB_DB=kormanyvalto
```

Optional (SSO / 3x mode, depending on deployment setup):
- SSO-related environment variables configured in Vercel for `/api/auth/*`

## Operations and Validation

Core validation commands:

```bash
npm run build
npm run lint
```

`npm run lint` is the repository verification gate and currently runs TypeScript type-checking, the style-rule audit, and dashboard regression tests.

Health checks after deploy:
- `/api/health`
- `/dashboard`
- `/dashboard-preview`
- county and EVK pages

Critical reliability rule:
- if a non-essential subsystem fails, the app should degrade gracefully instead of blocking the user journey.

## Architecture Snapshot

Main system areas:
- `src/app/*` - routes and page-level rendering
- `src/components/*` - reusable UI modules
- `src/lib/results.ts` - vote aggregation, history shaping, mandate data logic
- `src/lib/svgRegionMap.ts` - generic SVG region map loader
- `src/lib/hungaryCountyMap.ts` - Hungary county adapter for map dataset
- `src/lib/dashboardPreviewData.ts` - preview-only metrics for unpublished dashboard visuals
- `src/lib/dashboardDetailData.ts` - shared dashboard ranking builder and canonical county identity layer
- `src/components/VoteWidget.tsx` - canonical vote interaction state machine
- `src/components/PageChrome.tsx` - canonical shared hero shell

## Visual and UX Governance

Preview rule (active):
- every new `/dashboard-preview` visual must be fully interactive,
- all available links must be wired,
- county/city/EVK chips must navigate to real targets,
- no hardcoded chart values,
- no inline style for new visual modules,
- shared global CSS + reusable components required.

Active runtime workflow docs:
- `docs/WORKFLOWS.md`

Active design-system docs:
- `docs/DESIGN_SYSTEM.md`

## UI Card System

The app uses a global card system from `src/app/globals.css`:
- summary KPI cards: `.kpi-card`, `.kpi-value-chip`, `.kpi-dual-chip`
- analytics cards: `.chart-card`
- pie cards: `.pie-card`
- collectible ranking cards: `.preview-visual-card`, `.preview-trading-card`

Shared implementations:
- `src/components/dashboard/KpiCard.tsx`
- `src/components/dashboard/PieCard.tsx`

Rules:
- no inline style for layout/visual structure,
- no hardcoded one-off sizing per card,
- use shared classes and variants (`yes` / `no` / `neutral`),
- keep large KPI values single-line and compact (`K` / `M`).

## Documentation Map

- [docs/CHANGELOG.md](docs/CHANGELOG.md) - version history and shipped deltas
- [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) - local setup and coding workflow
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) - technical architecture and data flow
- [docs/WORKFLOWS.md](docs/WORKFLOWS.md) - active user journeys and vote UX contract
- [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md) - active design-system and shared visual rules
- [docs/OPERATIONS.md](docs/OPERATIONS.md) - deploy, runtime checks, incident checklist

## Handover and Dev Notes

- [handover.md](handover.md) - current repo state, recent completed work, next recommended step
- [READMEDEV.md](READMEDEV.md) - developer quick reference and anti-drift rules

SSOT note:
- treat `docs/WORKFLOWS.md`, `docs/DESIGN_SYSTEM.md`, `docs/ARCHITECTURE.md`, `docs/OPERATIONS.md`, `docs/SECURITY.md`, `READMEDEV.md`, and `handover.md` as the active truth set,
- do not treat older audit/remediation docs as live behavior contracts.

## Deployment

Vercel deployment model:
1. push to `main`
2. Vercel builds and deploys
3. verify health and key pages

Important operational note:
- map data loader has a deterministic fallback source to avoid build/runtime failure when dataset variants are unavailable.

## License

No license file is currently included.
