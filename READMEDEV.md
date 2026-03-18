# READMEDEV

Status: Active
Last Updated: 2026-03-18
Canonical: Yes

## Purpose

Developer-facing quick reference for working in this repo.

Use this alongside:
- `docs/DEVELOPMENT.md`
- `docs/ARCHITECTURE.md`
- `docs/WORKFLOWS.md`
- `docs/DESIGN_SYSTEM.md`

## Start Here

Install:

```bash
npm install
```

Run:

```bash
npm run dev
```

Verify before push:

```bash
npm run lint
npm run build
```

## Current Critical Contracts

### Vote button UX

Canonical sequence:
- `igen` -> `szavaztál` -> `igen (x,x s)` -> `igen`
- `nem` -> `szavaztál` -> `nem (x,x s)` -> `nem`

Implementation:
- `src/components/VoteWidget.tsx`
- `src/app/api/vote/route.ts`
- `src/lib/voteEngine.ts`
- `src/app/globals.css`

### Flash-state visual contract

- `szavaztál` uses the red danger-button aesthetic.
- It must not use the yellow warning-card look.
- It must not get stuck.

### Shared hero contract

- Hero is interactive.
- Hero uses county-level result colors.
- Hero text:
  - `2026 április 12`
  - `SZAVAZÁS`
  - `Váltani akarsz? Vagy nem? Kattints!`

Implementation:
- `src/components/PageChrome.tsx`
- `src/components/CountyHeroMap.tsx`

### Dashboard builder contract

- Shared ranking builder layer: `src/lib/dashboardDetailData.ts`
- Preview metrics layer: `src/lib/dashboardPreviewData.ts`
- `/dashboard` should not rebuild county-enriched ranking payloads locally.
- Development-time county identity assertions are active in the shared builder layer.

## Documentation Rules

If you change runtime behavior, update:
- `docs/WORKFLOWS.md`

If you change shared visual/state behavior, update:
- `docs/DESIGN_SYSTEM.md`

If you change architecture or builder ownership, update:
- `docs/ARCHITECTURE.md`

If you ship the change, update:
- `docs/CHANGELOG.md`
- `package.json` version
- `README.md` when user-facing repo summary changes

## Current Follow-Up Issue

- GitHub issue: `#1 Dashboard builder regression tests and preview-only cleanup`

## Anti-Drift Rules

- Prefer shared builders over route-local transformations.
- Prefer shared CSS/component contracts over one-off visual logic.
- Comment non-obvious state machines and integrity assertions.
- Do not let preview and production drift independently when they represent the same ranking logic.
