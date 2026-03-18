# Changelog

## 1.3.2 - 2026-03-18

### Changed
- Normalized navigation and utility button microcopy across the EVK flow and vote widget, including back actions, source links, retry actions, and the 3x login CTA.

### Documentation
- Updated workflow, design-system, and handover docs for navigation/button microcopy consistency.

## 1.3.1 - 2026-03-18

### Changed
- Aligned remaining route metadata titles with the visible page-title grammar.
- Normalized dashboard detail empty states onto a shared concise missing-data wording style.
- Renamed the `Béke szigetei` route/title family consistently across metadata and page copy.

### Documentation
- Updated workflow, design-system, and handover docs for metadata-title and empty-state consistency.

## 1.3.0 - 2026-03-18

### Changed
- Tightened dashboard and mandate card copy so analytics surfaces use shorter, more direct Hungarian state labels instead of older report-style phrasing.

### Documentation
- Updated workflow, design-system, and handover docs for the analytics-copy consistency contract.

## 1.2.9 - 2026-03-18

### Changed
- Normalized `/dashboard-preview` copy and labels so the route uses the same Hungarian page-title and card-label grammar as the rest of the dashboard instead of mixed English and repeated `(preview)` suffixes.

### Documentation
- Updated workflow, design-system, architecture, and handover docs for the preview-route naming contract.

## 1.2.8 - 2026-03-18

### Changed
- Moved the national home vote page onto the shared page-intro pattern so the top-level vote route matches the same local title/orientation structure used across the rest of the app.
- Removed the remaining widget-owned page heading dependency from the home vote flow.

### Documentation
- Updated workflow, design-system, architecture, and handover docs for the national vote-page intro contract.

## 1.2.7 - 2026-03-18

### Changed
- Moved EVK vote-page identity onto the shared page-intro pattern so the county -> EVK vote flow uses the same page-title hierarchy as the rest of the app.
- Updated `VoteWidget` so route-scoped vote pages can provide their own intro/context without inheriting the national default heading.

### Documentation
- Updated workflow, design-system, architecture, and handover docs for the shared vote-page intro contract.

## 1.2.6 - 2026-03-18

### Changed
- Extended the shared page-intro hierarchy to the main dashboard, dashboard preview, and mandate estimate pages so those routes follow the same local title/orientation pattern as the rest of the app.
- Removed duplicate page-level headings from the `/dashboard/igen` and `/dashboard/nem` infinite-scroll list routes by letting the route own the title and the grid client focus on list rendering.
- Reworked the privacy page's 3x/data-protection explainer onto the same trust-card fact-block grammar used in the live vote flow.

### Documentation
- Updated workflow, design-system, architecture, and handover docs for the canonical page-intro ownership and shared trust-card usage.

## 1.2.5 - 2026-03-18

### Changed
- Added a shared page-intro pattern so major routes open with a clearer local title and orientation copy instead of dropping directly into cards or legal text.
- Applied the new intro pattern to dashboard detail pages, county navigation pages, and legal pages.

### Documentation
- Updated workflow and design-system docs for the shared page-intro contract.

## 1.2.4 - 2026-03-18

### Changed
- Renamed the shared EVK primary navigation label to `⚠ EVK 2026 ⚠`.

### Documentation
- Updated the workflow and handover docs to reflect the shared EVK nav label.

## 1.2.3 - 2026-03-18

### Changed
- Normalized the recent 3x VOTE card states so active, available, and unavailable variants use a more consistent visual grammar and information hierarchy.

### Documentation
- Updated the design-system contract for 3x state consistency.

## 1.2.2 - 2026-03-18

### Changed
- Reworked the 3x VOTE panel into clearer trust-first fact blocks so the benefit, login purpose, and privacy boundary are easier to scan.
- Made Google login failure and unavailable-state copy more actionable while keeping anonymous voting explicitly available.

### Documentation
- Added the 3x vote trust contract to workflow, design-system, and architecture docs.

## 1.2.1 - 2026-03-18

### Fixed
- Vote history county, city, and `Országos` chips now use their own historical result state at the time of each recorded vote instead of the current latest aggregate color.

### Documentation
- Added the vote history historical-state contract to the workflow docs.

## 1.2.0 - 2026-03-18

### Changed
- Improved county and EVK navigation clarity with explicit step-based copy on the county routes.
- Added a county context panel on county EVK list pages and a clearer county -> EVK title hierarchy on EVK vote pages.
- Expanded EVK page actions so users can return to the county page, the full county list, or the NVI source without losing orientation.

### Documentation
- Updated workflow, design-system, and architecture docs for the county -> EVK -> vote navigation contract.

## 1.1.9 - 2026-03-18

### Changed
- Hardened the primary vote flow so auth-session reads no longer block the main results load.
- Updated vote UX degradation behavior so accepted votes keep their saved state even if the follow-up summary refresh fails, with an inline retry action instead of a false failure.

### Documentation
- Updated workflow, design-system, and architecture docs for the fail-open vote refresh contract.

## 1.1.8 - 2026-03-18

### Changed
- Completed the dashboard consistency sweep by moving `/dashboard/kiegyensulyozott-varmegyek` onto the shared county ranking card.
- Unified `/dashboard/igen` and `/dashboard/nem` around canonical county-enriched dashboard ranking items so infinite-scroll city cards keep county links, county codes, and county tones consistent with the rest of the dashboard.

### Documentation
- Updated workflow, design-system, architecture, and dashboard consistency docs for the completed sweep and shared bloc-list contract.

## 1.1.7 - 2026-03-18

### Changed
- Reduced `src/lib/dashboardPreviewData.ts` further so `/dashboard-preview` computes only preview-specific metrics and active-county activity data that the route actually renders.

### Documentation
- Updated workflow and architecture docs to reflect the smaller preview-data ownership surface.

## 1.1.6 - 2026-03-18

### Added
- Added automated dashboard regression tests for canonical county identity and shared ranking ordering.

### Changed
- Reduced `src/lib/dashboardPreviewData.ts` to preview-specific metrics while reusing shared ranking payloads directly from `src/lib/dashboardDetailData.ts`.
- Tightened dashboard ranking renderers so county silhouette stamps resolve from canonical `countyCode` only.

### Documentation
- Updated workflow, design-system, and architecture docs for the shared dashboard builder ownership and county identity contract.

## 1.1.5 - 2026-03-18

### Changed
- Unified `/dashboard` and `/dashboard-preview` ranking assembly around the shared builder layer in `src/lib/dashboardDetailData.ts`.
- Added development-time county identity integrity assertions for dashboard ranking payloads.

### Documentation
- Updated architecture, development, and dashboard consistency planning docs to reflect the shared builder layer and current roadmap state.

## 1.1.4 - 2026-03-18

### Added
- Added `docs/WORKFLOWS.md` as the active source-of-truth document for runtime user journeys and vote-button behavior.
- Added `docs/DESIGN_SYSTEM.md` as the active source-of-truth document for shared visual/state contracts.

### Changed
- Updated README, architecture, development, knowledge-base, and operations docs to reflect the live hero, vote interaction behavior, and documentation governance rules.

### Governance
- Established explicit documentation ownership for active workflows, design-system behavior, and release synchronization.

## 1.1.3 - 2026-03-17

### Fixed
- Replaced the broken `next lint` script with a stable repository lint gate based on `tsc --noEmit` plus the style-rule check.

### Changed
- Pinned `next`, `react`, and `react-dom` to the installed runtime versions instead of using `latest`.
- Extracted shared dashboard KPI and pie cards into reusable components so `/dashboard` and `/dashboard-preview` no longer carry duplicate local implementations.

### Documentation
- Updated README and development guidance to match the current verification flow and shared dashboard card ownership.

## 1.1.2 - 2026-03-15

### Changed
- Standardized dashboard and mandate KPI cards to the global card system.
- Added compact KPI number rendering (`K` / `M`) to avoid line breaks in large value chips.
- Moved `Elsöprő győzelmek` from `/dashboard` to `/dashboard-preview`.
- Updated map and parliament visual strokes to white where requested.

### Documentation
- Updated README and engineering docs with current dashboard/preview ownership.
- Added explicit reusable KPI/card implementation guidance and style governance notes.

## 1.1.1 - 2026-03-15

### Fixed
- Collectible ranking cards now show county names (e.g. `Pest vármegye`) instead of numeric placeholders (e.g. `08. vármegye`).

### Changed
- Moved preview section `3. Top csataterek` to production `/dashboard`.
- Kept `/dashboard-preview` focused on experimental sections (`4-6`) and validation visuals.

### Documentation
- Updated route responsibilities in `README.md` for `/dashboard` vs `/dashboard-preview`.

## 1.1.0 - 2026-03-15

### Added
- `/dashboard-preview` experimental route for new visual QA before production dashboard rollout.
- Reusable preview data layer (`src/lib/dashboardPreviewData.ts`).
- Reusable preview visual components:
  - lead overview
  - reporting coverage
  - city rankings
  - county rankings
- Generic reusable SVG region map engine (`src/lib/svgRegionMap.ts`).

### Changed
- County map moved from `/dashboard` to `/ogy2026/egyeni-valasztokeruletek`.
- County map loading refactored through explicit Hungary adapter (`src/lib/hungaryCountyMap.ts`) with robust fallback strategy.
- County SVG parsing fixed and standardized for reliable region rendering.

### Governance
- Added explicit preview-interactivity rule to knowledge base:
  - all preview visuals must be fully interactive with real links and chips,
  - no hardcoded values,
  - no in-code styling for new visual modules.

### Documentation
- Replaced README with a professional product-level structure:
  - overview, architecture snapshot, operations/validation, docs map.
- Added developer and operations documentation:
  - `docs/DEVELOPMENT.md`
  - `docs/ARCHITECTURE.md`
  - `docs/OPERATIONS.md`
