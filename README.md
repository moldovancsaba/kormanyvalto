# Kormanyvalto
Status: Active
Last Updated: 2026-03-15
Canonical: Yes
Owner: Product

<p align="center">
  <img src="public/images/hero_vote.png" alt="Kormanyvalto hero" width="360" />
</p>

<h1 align="center">Kormanyvalto</h1>
<p align="center"><strong>Election-style civic game platform for OGY 2026 simulation: országos, vármegyei, and EVK voting with analytics and mandate estimation.</strong></p>

<p align="center">
  <img src="https://img.shields.io/badge/version-v1.1.2-2563EB?style=for-the-badge" alt="Version">
  <img src="https://img.shields.io/badge/platform-Web%20App-0F172A?style=for-the-badge" alt="Platform">
  <img src="https://img.shields.io/badge/stack-Next.js%20%7C%20MongoDB-0EA5E9?style=for-the-badge" alt="Stack">
</p>

<p align="center">
  <a href="#product-overview">Product Overview</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#operations-and-validation">Operations & Validation</a> •
  <a href="#documentation-map">Documentation Map</a>
</p>

## Product Overview

`Kormanyvalto` is a Next.js + MongoDB platform where users can vote (`igen` / `nem`) at multiple scopes and view aggregated public mood and seat estimates.

Core capabilities:
- National (`Országos`) vote stream and barometer
- Hierarchical election navigation (country -> county -> EVK)
- Scope-aware vote history and source labeling
- 3x authenticated mode with Google SSO flow
- Dashboard analytics and preview-first visual pipeline
- 199-seat mandate estimation (106 EVK + 93 list)
- County map visualization with reusable SVG region engine

## Main Routes

- `/` - national vote page
- `/dashboard` - production analytics dashboard (`Csataterek`, `Biztos bástyák`, county/city chart pack, KPI + pie)
- `/dashboard-preview` - preview board for upcoming visuals (includes staging charts like `Elsöprő győzelmek`; intentionally not linked from navigation)
- `/mandatumbecsles` - mandate estimate and parliament visualization
- `/ogy2026/egyeni-valasztokeruletek` - county list + county map
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

Health checks after deploy:
- `/api/health`
- `/dashboard`
- `/dashboard-preview`
- county and EVK pages

## Architecture Snapshot

Main system areas:
- `src/app/*` - routes and page-level rendering
- `src/components/*` - reusable UI modules
- `src/lib/results.ts` - vote aggregation, history shaping, mandate data logic
- `src/lib/svgRegionMap.ts` - generic SVG region map loader
- `src/lib/hungaryCountyMap.ts` - Hungary county adapter for map dataset
- `src/lib/dashboardPreviewData.ts` - reusable data builders for preview visuals

## Visual and UX Governance

Preview rule (active):
- every new `/dashboard-preview` visual must be fully interactive,
- all available links must be wired,
- county/city/EVK chips must navigate to real targets,
- no hardcoded chart values,
- no inline style for new visual modules,
- shared global CSS + reusable components required.

See: `docs/KNOWLEDGE_BASE.md`

## UI Card System

The app uses a global card system from `src/app/globals.css`:
- summary KPI cards: `.kpi-card`, `.kpi-value-chip`, `.kpi-dual-chip`
- analytics cards: `.chart-card`
- pie cards: `.pie-card`
- collectible ranking cards: `.preview-visual-card`, `.preview-trading-card`

Rules:
- no inline style for layout/visual structure,
- no hardcoded one-off sizing per card,
- use shared classes and variants (`yes` / `no` / `neutral`),
- keep large KPI values single-line and compact (`K` / `M`).

## Documentation Map

- [docs/KNOWLEDGE_BASE.md](docs/KNOWLEDGE_BASE.md) - active product/engineering rules
- [docs/CHANGELOG.md](docs/CHANGELOG.md) - version history and shipped deltas
- [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) - local setup and coding workflow
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) - technical architecture and data flow
- [docs/OPERATIONS.md](docs/OPERATIONS.md) - deploy, runtime checks, incident checklist

## Deployment

Vercel deployment model:
1. push to `main`
2. Vercel builds and deploys
3. verify health and key pages

Important operational note:
- map data loader has a deterministic fallback source to avoid build/runtime failure when dataset variants are unavailable.

## License

No license file is currently included.
