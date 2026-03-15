# Changelog

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
