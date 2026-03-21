# Handover

Status: Active
Last Updated: 2026-03-18
Canonical: Yes

## Current Repo State

- Branch: `main`
- Source of truth remote: `origin`
- Current released version: `1.3.6`
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

### Shared page-intro rollout

- Major routes now open with a consistent local page intro instead of dropping directly into cards or long legal text.
- Dashboard detail pages, county navigation pages, and legal pages now share the same intro hierarchy.
- Main dashboard, dashboard preview, and mandate estimate pages now use that same intro family.
- Embedded dashboard bloc-list clients no longer duplicate the route title with a second page-level heading.
- Privacy/3x explainer content now reuses the same trust-card fact grammar as the live vote flow.
- EVK vote pages now provide county -> EVK context through the shared page-intro pattern instead of a route-local hero-title override.
- The national home vote page now uses the same shared page-intro ownership model instead of relying on widget-owned heading copy.
- `/dashboard-preview` now uses the same Hungarian page and card naming grammar as the production dashboard, with preview status expressed at the route level.
- Dashboard and mandate analytics cards now use shorter, more direct labels so card copy matches the newer page-intro voice.
- Route metadata titles now track the same naming grammar as visible page titles, and dashboard detail empty states now use one shared fallback wording family.
- Navigation and utility buttons now use more consistent microcopy across the EVK flow and voting surfaces.
- Vote and list-preview error states now normalize raw browser fetch errors into Hungarian user-facing copy.
- Route transitions now show a shared branded loading screen instead of a blank page.
- The shared EVK primary navigation label is now `egyéni választókerületek`.

Main files:
- `src/components/AppLoader.tsx`
- `src/app/loading.tsx`
- `src/components/PageChrome.tsx`
- `src/components/VoteWidget.tsx`
- `src/app/page.tsx`
- `src/app/dashboard-preview/page.tsx`
- `src/app/dashboard/page.tsx`
- `src/app/mandatumbecsles/page.tsx`
- `src/app/dashboard/*/page.tsx`
- `src/app/ogy2026/egyeni-valasztokeruletek/page.tsx`
- `src/app/ogy2026/egyeni-valasztokeruletek/[maz]/page.tsx`
- `src/app/ogy2026/egyeni-valasztokeruletek/[maz]/[evk]/page.tsx`
- `src/components/CityBlocGridClient.tsx`
- `src/app/globals.css`
- `docs/WORKFLOWS.md`

## Short Roadmap

1. Delivery truth pass.
   - keep the active docs in sync with shipped code
   - remove stale guidance that still points to completed follow-ups as future work
2. Analytics reliability hardening.
   - add route-level regression coverage where analytics pages still rely on local composition
   - verify degraded empty/error states on `dashboard` and `mandatumbecsles`
3. Delivery packaging.
   - final review of README, handover, and operations docs for client-facing readiness
   - keep release metadata synchronized on each shipped slice

## Current Open Follow-Up

GitHub issue status:
- `#1 Dashboard builder regression tests and preview-only cleanup` is completed in code and covered by `tests/dashboardDetailData.test.ts`

Project board:
- `MVP Factory Board`
- current status: `Backlog (SOONER)`

## Recommended Next Step

Work next on:
- analytics degraded-state verification and broader regression coverage,
- then final delivery review against the active SSOT docs.

## Core Function Status

- National voting: implemented and live.
- County -> EVK -> vote journey: implemented and live.
- 3x Google-authenticated mode: implemented and live as an optional sidecar.
- Dashboard shared builder layer: implemented and regression-tested.
- Dashboard preview boundary: implemented; preview owns only preview-specific metrics.
- Mandate estimate: implemented and live.
- Main remaining delivery risk: documentation drift and incomplete route-level regression coverage, not missing core user journeys.

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
- Treat the active SSOT set as:
  - `docs/WORKFLOWS.md`
  - `docs/DESIGN_SYSTEM.md`
  - `docs/ARCHITECTURE.md`
  - `docs/OPERATIONS.md`
  - `docs/SECURITY.md`
  - `READMEDEV.md`
  - `handover.md`
- Update docs when behavior changes.
- Bump version and changelog for shipped behavior/architecture changes.
- Keep critical flows fail-open where appropriate.
- Prefer shared builders/components over new route-local logic.
