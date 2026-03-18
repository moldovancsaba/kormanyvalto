# Handover

Status: Active
Last Updated: 2026-03-18
Canonical: Yes

## Current Repo State

- Branch: `main`
- Source of truth remote: `origin`
- Current released version: `1.2.4`
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

### EVK navigation label update

- The shared primary navigation label for the constituency flow is now `⚠ EVK 2026 ⚠`.

Main files:
- `src/lib/navigation.ts`
- `docs/WORKFLOWS.md`

## Short Roadmap

1. Vote flow reliability and degraded-state UX.
   - keep voting fail-open when auth/session, summary refresh, or secondary reads fail
   - make retry paths immediate and explicit
2. County and EVK navigation clarity.
   - reduce ambiguity between county list, EVK list, and vote page back-paths
   - tighten copy and action hierarchy around the hero and page titles
3. Trust and transparency around 3x voting mode.
   - make the multiplier, cooldown advantage, and privacy boundaries easier to scan
   - ensure login failure states are actionable
4. Operational confidence pass on analytics pages.
   - review `dashboard` and `mandatumbecsles` for degraded empty/error states
   - add regression coverage where route-local behavior still matters

## Current Open Follow-Up

GitHub issue:
- `#1 Dashboard builder regression tests and preview-only cleanup`

Project board:
- `MVP Factory Board`
- current status: `Backlog (SOONER)`

## Recommended Next Step

Work next on:
- roadmap slice 4: degraded-state review on dashboard and mandate pages,
- then extend regression coverage where route-local empty/error behavior still matters.

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
