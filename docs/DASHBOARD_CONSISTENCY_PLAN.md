# Dashboard Consistency Elimination Plan

Date: 2026-03-16

## Goal

Eliminate dashboard inconsistencies by enforcing one canonical county identity and one shared dashboard card-data pipeline.

## Phase 1. Canonical Identity Layer

Status: complete in active code

Tasks:
- keep `src/lib/territoryPaths.ts` as the only path parser,
- stop deriving county identity ad hoc in route files,
- define one canonical county identity contract for cards.

Target contract:
- `countyCode`
- `countyName`
- `countyHref`

Rule:
- all three must be generated together by shared builder logic, never assembled independently.

## Phase 2. Shared Dashboard Card Builders

Status: substantially complete

Tasks:
- extract county-enriched city-card builder from route files,
- extract county-card builder from route files,
- use same builder output for `/dashboard` and `/dashboard-preview`.

Benefits:
- same source ordering,
- same county lead computation,
- same href generation,
- less route-level duplication.

## Phase 3. Integrity Assertions

Status: started

Tasks:
- add runtime assertions in dev/build paths for dashboard card payloads,
- verify:
  - href county segment matches `countyCode`,
  - `countyName` maps back to the same canonical county,
  - one county aggregate exists only once in county ranking sections.

Suggested checks:
- `assertCountyIdentityConsistency()` helper in `src/lib/*`
- run in dashboard data builders in development mode

## Phase 4. Renderer Contract Tightening

Status: complete in active code

Tasks:
- update card renderers to trust one canonical county identity source,
- remove unnecessary fallback ambiguity where possible,
- ensure map stamps, links, and titles all use the same canonical county object.

## Phase 5. Regression Audit

Status: in progress

Tasks:
- walk every dashboard section after the builder refactor:
  - `Csataterek`
  - `A béke szigetei`
  - `Előrejelző városok`
  - `Senki nem tudja`
  - `Kiegyensúlyozott vármegyék`
  - `Háborús övezetek`
  - `Biztos bástyák`
  - `Az igen városok`
  - `A nem városok`
- confirm title, county, href, tone, and map are coherent

## Immediate Next Steps

1. Run another full dashboard consistency sweep and update this report.
2. Extend regression coverage if a new preview or production ranking surface is promoted.
