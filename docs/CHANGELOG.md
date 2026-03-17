# Changelog

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
