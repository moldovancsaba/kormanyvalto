# Product Workflows

Status: Active
Last Updated: 2026-03-18
Canonical: Yes

## Purpose

This file is the source of truth for live user-facing workflows.

If code changes the runtime user journey, update this file in the same change-set.

## Core UX Rule

- User UX and user journey are the number 1 priority.
- Core flows must remain available even when secondary systems degrade.
- The app should prefer degraded behavior over frozen or ambiguous behavior.

## Primary Journeys

### National voting

Route:
- `/`

Flow:
1. User lands on the national vote page.
2. Shared county-result hero loads at the top.
3. Lead snapshot and totals load.
4. User presses `igen` or `nem`.
5. Immediate feedback appears before the vote request completes.
6. Cooldown state appears after the success flash.
7. Results and history update from the accepted response.

Implementation:
- `src/components/VoteWidget.tsx`
- `src/components/PageChrome.tsx`
- `src/app/api/vote/route.ts`
- `src/lib/voteEngine.ts`
- `src/lib/results.ts`

### County navigation

Routes:
- `/ogy2026/egyeni-valasztokeruletek`
- `/ogy2026/egyeni-valasztokeruletek/[maz]`

Flow:
1. User enters the county-list route.
2. The shared interactive hero acts as the first county navigator.
3. The list below provides the second navigation path.
4. Selecting a county opens a county context page that explains the next step and lists the EVK choices.
5. Selecting an EVK opens the vote page for that constituency.

Navigation label:
- shared primary-nav button text: `⚠ EVK 2026 ⚠`

Implementation:
- `src/components/CountyHeroMap.tsx`
- `src/components/PageChrome.tsx`
- `src/app/ogy2026/egyeni-valasztokeruletek/*`

### EVK voting

Route:
- `/ogy2026/egyeni-valasztokeruletek/[maz]/[evk]`

Flow:
1. User lands on an EVK page.
2. The shared county-result hero remains visible.
3. The hero title area is replaced by a clearer county -> EVK identity stack.
4. Vote interaction uses the same state machine as the national page.
5. User can navigate back to county context, the full county list, or source data without losing orientation.

Implementation:
- `src/app/ogy2026/egyeni-valasztokeruletek/[maz]/[evk]/page.tsx`
- `src/components/VoteWidget.tsx`

## Vote Button State Machine

Applies to:
- national vote page
- EVK vote pages

Canonical sequence after a successful `nem` click:
- `nem`
- `szavaztál`
- `nem (5,2 s)`
- `nem`

Canonical sequence after a successful `igen` click:
- `igen`
- `szavaztál`
- `igen (5,2 s)`
- `igen`

Rules:
- `szavaztál` must render immediately on click.
- The countdown must be ready before the flash ends.
- The button must never briefly fall back to plain `igen` or `nem` between flash and countdown.
- The flash state is temporary only.
- When cooldown expires, the base label returns.

Implementation details:
- `VoteWidget` starts the flash immediately.
- `HEAD /api/vote?scope=...` is used to prefetch next cooldown state.
- Cooldown starts optimistically on click.
- POST response reconciles optimistic state with server truth.
- The flash timer is independent from the countdown tick.

Implementation files:
- `src/components/VoteWidget.tsx`
- `src/app/api/vote/route.ts`
- `src/lib/voteEngine.ts`

## Vote Error Behavior

Rules:
- Error state must not leave the button stuck in `szavaztál`.
- If the vote request fails, optimistic cooldown must be cleared.
- Error copy must help the user path without exposing internals.
- Auxiliary protection failures must not break ordinary voting if degraded behavior exists.
- Auth/session reads must not block result loading or ordinary anonymous voting.
- If a vote is accepted but the follow-up summary refresh fails, the UI must say the vote was saved and offer a retry instead of implying the vote was lost.
- Vote/result read failures should offer an immediate retry path on the same screen.

## Vote History Contract

Rules:
- History chips for `Országos`, county, and city labels must reflect the result state that existed immediately after that recorded vote.
- History chips must not be recolored from the latest present-day aggregate if that historical result was different.

## Hero Contract

Canonical hero text:
- `2026 április 12`
- `SZAVAZÁS`
- `Váltani akarsz? Vagy nem? Kattints!`

Rules:
- The hero is interactive.
- The hero uses county-level result colors.
- The hero is navigation, not decoration.
- County-list pages must not duplicate the same map directly below the hero.

Implementation:
- `src/components/PageChrome.tsx`
- `src/components/CountyHeroMap.tsx`

## Social Share Contract

Default social image:
- shared default image from `src/lib/assets.ts`

County title format:
- `Szavazás 2026 - Somogy vármegye`

EVK/city title format:
- `Szavazás 2026 - Miskolc`

Implementation:
- `src/lib/siteMetadata.ts`
- `src/app/ogy2026/egyeni-valasztokeruletek/[maz]/page.tsx`
- `src/app/ogy2026/egyeni-valasztokeruletek/[maz]/[evk]/page.tsx`

## 3x Vote Trust Contract

Rules:
- Anonymous voting must remain usable even if Google login is unavailable or fails.
- The 3x VOTE panel must state clearly:
  - what the user gains,
  - what login is used for,
  - what is not stored.
- Login failure copy must point the user back to an available anonymous voting path.

## Reliability Rules

- Vote flow must fail open against non-essential sidecars where possible.
- Security, abuse scoring, telemetry, and analytics must degrade without blocking the main user journey.
- First-click responsiveness matters; warmup/preload paths are acceptable if they preserve semantics.

## Dashboard Ranking Workflow

Routes:
- `/dashboard`
- `/dashboard-preview`

Rules:
- County-enriched ranking outputs must come from the shared builder in `src/lib/dashboardDetailData.ts`.
- Preview owns only preview-specific metrics such as coverage, active-county activity, and list-vote preview state.
- County identity for dashboard ranking cards flows through canonical `countyCode` and `countyHref` values, not renderer-side county-name recovery.
- Detail routes under `/dashboard/*` should reuse the shared ranking card families for city and county sections, including infinite-scroll bloc lists.
- If dashboard ranking metrics fail, pages should still render their surrounding shell with empty ranking states rather than crash.
