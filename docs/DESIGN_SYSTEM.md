# Design System

Status: Active
Last Updated: 2026-03-18
Canonical: Yes

## Purpose

This file defines the active design-system contracts used by the application.

It is the engineering source of truth for:
- tokens,
- shared component families,
- stateful interaction visuals,
- reusable class ownership.

## Source Of Truth

Implementation:
- `src/app/globals.css`

Shared UI modules:
- `src/components/*`
- `src/components/dashboard/*`

## Core Product Rule

- User UX and user journey are the number 1 priority.
- Visual consistency protects user comprehension and trust.
- Interaction feedback must be immediate and unambiguous.

## Global Tokens

Defined in:
- `src/app/globals.css`

Key groups:
- layout and surfaces
- vote palettes
- text and shell tokens
- utility palettes
- radius system

Rule:
- Reuse existing tokens before introducing new ones.

## Shared Component Families

### Vote buttons

Implementation:
- `src/components/VoteWidget.tsx`
- `src/app/globals.css`

Base classes:
- `.vote-btn`
- `.vote-btn-yes`
- `.vote-btn-no`

State classes:
- `.vote-btn-flash`
- `.vote-btn-flash-yes`
- `.vote-btn-flash-no`

Contract:
- base state uses yes/no palette
- success flash uses the red danger-button aesthetic
- cooldown state uses the normal vote button family with countdown text
- labels stay legible during all animated states

### Danger navigation buttons

Implementation:
- `src/components/PageChrome.tsx`
- `src/app/globals.css`

Classes:
- `.nav-link-button`
- `.nav-link-button-danger`

Contract:
- red gradient surface
- dark red border
- inset light inner ring
- dark pressed-shell shadow

Important:
- the `szavaztál` flash state intentionally reuses this red danger-button language

### 3x trust cards

Implementation:
- `src/components/VoteWidget.tsx`
- `src/app/globals.css`

Contract:
- trust messaging should be scannable in short fact blocks, not dense warning paragraphs
- the panel must distinguish benefit, verification purpose, and non-retention/privacy boundaries
- authenticated and unauthenticated 3x states should still feel like the same component family
- available, active, and unavailable 3x states should reuse one consistent card grammar instead of switching visual voice

### Hero system

Implementation:
- `src/components/PageChrome.tsx`
- `src/components/CountyHeroMap.tsx`

Contract:
- hero is interactive
- hero text is top-left overlay content
- hero uses county result colors
- hero map is navigation, not a static image
- EVK vote pages should keep the hero map generic and place county -> EVK context in the shared page-intro area below the action row

### Page intros

Implementation:
- `src/components/PageChrome.tsx`
- `src/app/globals.css`

Contract:
- major routes should open with a clear local page intro, not jump directly into a card or body copy
- intro structure should be eyebrow -> title -> short orientation copy where appropriate
- national voting, dashboard pages, dashboard detail pages, county navigation pages, mandate analytics, preview pages, and legal pages should reuse the same intro family
- when a route supplies the page intro, embedded cards or list clients should not render another page-level `h1`

### Dashboard cards

Shared implementations:
- `src/components/dashboard/KpiCard.tsx`
- `src/components/dashboard/PieCard.tsx`
- `src/components/dashboard/CityRankingCard.tsx`
- `src/components/dashboard/CountyRankingCard.tsx`
- `src/components/dashboard/LeadOverviewCard.tsx`

Shared class families:
- `.kpi-*`
- `.chart-card*`
- `.pie-card*`
- `.preview-*`
- `.title-inline-chip*`

Contract:
- route files compose from shared families
- route files should not invent local grammars for existing patterns
- county silhouette stamps in ranking cards resolve from canonical `countyCode` props supplied by shared builders
- renderer components must not recover county identity from display names when canonical ids are already available
- dashboard bloc list pages should keep the same ranking-card visual language even when items stream in via infinite scroll
- bloc-list routes should let the route-level intro own page orientation and keep the list client focused on card/grid rendering
- preview dashboard routes should keep the same language and label grammar as production dashboard routes instead of mixing in standalone prototype naming

## Vote Interaction Visual Contract

Canonical success sequence:
- base label
- `szavaztál`
- countdown label
- base label

Canonical flash look:
- red danger-button treatment
- short pulse
- subtle bloom
- short sweep/shimmer

Non-negotiable rules:
- no ambiguous intermediate label
- no stalled `szavaztál` state
- no flash color that conflicts with the intended red danger-button design
- degraded-state vote messaging should stay inline on the same screen and include a clear retry action when data refresh fails

## Governance

- No inline style for new visual modules.
- If a new stateful pattern appears twice, make it a shared class or shared component.
- If a visual state changes user-facing behavior, document it here and in `docs/WORKFLOWS.md`.
- Multi-step navigation pages should use explicit orientation copy rather than assuming the user understands the county -> EVK -> vote hierarchy.
