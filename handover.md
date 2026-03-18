# Handover

Status: Active
Last Updated: 2026-03-18
Canonical: Yes

## Current Repo State

- Branch: `main`
- Source of truth remote: `origin`
- Current released version: `1.1.5`
- Verification gate:
  - `npm run lint`
  - `npm run build`

## Product Priority

- User UX and user journey are the number 1 priority.
- This app is critical.
- Core flows must keep working even when secondary systems degrade.

## What Was Recently Completed

### Vote UX and interaction

- Vote button workflow is now documented and implemented as:
  - `nem` -> `szavaztál` -> `nem (x,x s)` -> `nem`
  - `igen` -> `szavaztál` -> `igen (x,x s)` -> `igen`
- The `szavaztál` flash uses the red danger-button aesthetic.
- First-click responsiveness was improved with vote-route warmup and optimistic cooldown.

Main files:
- `src/components/VoteWidget.tsx`
- `src/app/api/vote/route.ts`
- `src/lib/voteEngine.ts`
- `src/app/globals.css`

### Hero and navigation

- Shared interactive county-result hero is active.
- County-list page no longer duplicates the same map below the hero.
- Hero copy and interaction contract are documented.

Main files:
- `src/components/PageChrome.tsx`
- `src/components/CountyHeroMap.tsx`
- `docs/WORKFLOWS.md`

### Documentation remediation

- Active workflow docs added.
- Active design-system docs added.
- README, architecture, development, and operations docs were aligned with live code.

Main files:
- `docs/WORKFLOWS.md`
- `docs/DESIGN_SYSTEM.md`
- `docs/ARCHITECTURE.md`
- `docs/DEVELOPMENT.md`
- `README.md`

### Dashboard builder unification

- `/dashboard` and `/dashboard-preview` now reuse the shared ranking builder layer more consistently.
- Development-time county identity assertions were added to catch builder drift early.

Main files:
- `src/lib/dashboardDetailData.ts`
- `src/lib/dashboardPreviewData.ts`
- `src/app/dashboard/page.tsx`

## Current Open Follow-Up

GitHub issue:
- `#1 Dashboard builder regression tests and preview-only cleanup`

Project board:
- `MVP Factory Board`
- current status: `Backlog (SOONER)`

## Recommended Next Step

Work next on:
- automated regression tests for dashboard county identity and ranking outputs,
- reducing remaining preview-only assembly to preview-specific metrics only,
- tightening renderer contracts around one canonical county identity path,
- then run another dashboard consistency sweep.

## Important Active Docs

- Product workflows: `docs/WORKFLOWS.md`
- Design system: `docs/DESIGN_SYSTEM.md`
- Architecture: `docs/ARCHITECTURE.md`
- Development rules: `docs/DEVELOPMENT.md`
- Security: `docs/SECURITY.md`
- Operations: `docs/OPERATIONS.md`
- Changelog: `docs/CHANGELOG.md`

## Rules For The Next Agent

- Do not treat old audit/remediation docs as the active behavior contract.
- Update docs when behavior changes.
- Bump version and changelog for shipped behavior/architecture changes.
- Keep critical flows fail-open where appropriate.
- Prefer shared builders/components over new route-local logic.
