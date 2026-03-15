# Kormanyvalto

![Hero](/Users/moldovancsaba/Projects/kormanyvalto/public/images/hero_vote.png)

Version: `1.1.0`

Kormanyvalto is a Next.js election-style game platform for OGY 2026 simulations with national, county, and EVK voting scopes, analytics, seat estimation, and preview-first visual delivery.

## Core Features

- Scope-based voting (`Országos`, county, EVK)
- Live barometers and history feed with source context
- 3x authenticated voting mode support
- County and EVK hierarchy pages
- Dashboard analytics (`/dashboard`)
- Mandate estimate / parliament visualization (`/mandatumbecsles`)
- Preview board for upcoming visuals (`/dashboard-preview`)

## Main Routes

- `/` - national vote
- `/dashboard` - general mood dashboard
- `/dashboard-preview` - staging area for new visuals (not linked from navigation)
- `/mandatumbecsles` - mandate estimate and parliament view
- `/ogy2026/egyeni-valasztokeruletek` - county list + county map
- `/ogy2026/egyeni-valasztokeruletek/[maz]` - EVK list by county
- `/ogy2026/egyeni-valasztokeruletek/[maz]/[evk]` - EVK voting page

## Data And APIs

MongoDB collections:

- `votes`
- `vote_sessions`

Key API endpoints:

- `GET /api/results`
- `POST /api/vote`
- `GET /api/health`
- auth/session endpoints under `/api/auth/*`

## Visual Architecture

- Shared map engine: `src/lib/svgRegionMap.ts`
- Hungary county adapter: `src/lib/hungaryCountyMap.ts`
- Shared preview data builder: `src/lib/dashboardPreviewData.ts`
- Shared preview components: `src/components/dashboard-preview/*`
- Global design system and visual classes: `src/app/globals.css`

## Delivery Rules

Current strict standards are recorded in:

- `docs/KNOWLEDGE_BASE.md`

Highlights:

- All new preview visuals must be fully interactive.
- Every available destination must be linked.
- Chips must be clickable where county/city/EVK context exists.
- No hardcoded chart data.
- No in-code style for new visual modules.

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Configure environment variables:

- `MONGODB_URI` (required)
- `MONGODB_DB` (recommended)

3. Run dev server:

```bash
npm run dev
```

4. Build check:

```bash
npm run build
```

## Deployment

- Deploy on Vercel
- Ensure env vars are set
- Verify after deploy:
  - `/api/health`
  - `/dashboard`
  - `/dashboard-preview`
  - county/EVK pages

## Additional Documentation

- Knowledge base: `docs/KNOWLEDGE_BASE.md`
- Changelog: `docs/CHANGELOG.md`
