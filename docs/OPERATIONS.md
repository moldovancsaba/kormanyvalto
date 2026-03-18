# Operations Guide

Status: Active
Last Updated: 2026-03-18
Canonical: Yes

## Reliability Doctrine

- User UX and user journey are the number 1 priority.
- `Kormanyvalto` is a critical app; vote flow and core navigation must keep working whatever happens.
- In incidents, protect core user availability first and preserve stricter auxiliary controls second.
- Prefer degraded mode over hard failure for non-essential systems.

## Deployment Pipeline

- Source of truth branch: `main`
- Platform: Vercel
- Build command: `npm run build`

Typical flow:
1. Push to `main`
2. Vercel build executes
3. Verify runtime endpoints/pages

## Post-Deploy Verification Checklist

Mandatory checks:
- `GET /api/health`
- `/` vote interactions load
- `/dashboard` loads without server errors
- `/dashboard-preview` loads preview visuals
- `/mandatumbecsles` renders seat visuals
- `/ogy2026/egyeni-valasztokeruletek` renders county map and county list

## Incident Triage

### Build failure

1. Reproduce locally:

```bash
npm run build
```

2. Check for missing static assets under `public/`
3. Validate map dataset fallback behavior (`svgRegionMap` adapter chain)

### Runtime data error (Mongo)

1. Verify `MONGODB_URI` and `MONGODB_DB`
2. Check `/api/health`
3. Confirm DB/network rules on Atlas and Vercel

### Auth / 3x mode issues

1. Verify `/api/auth/session`
2. Verify login callback settings and deployed env config
3. Validate that vote API still accepts non-auth and auth paths correctly

### Critical user-flow regression

1. Confirm `/` still renders and the vote action returns a non-500 response.
2. If a security, telemetry, or analytics layer is causing user-facing failure, switch the affected logic to degraded mode immediately.
3. Restore stricter protections only after the core user journey is stable again.

## Security and Abuse Posture

Current protections include:
- security headers
- no-cache controls on API routes where relevant
- rate limiting for critical endpoints

Operational recommendation:
- enforce Vercel edge protections (WAF/challenge/rate controls) for traffic spikes.
- never allow edge/security controls to silently break first-party browser traffic on the critical vote path.

## Observability Notes

At minimum track:
- deployment health
- API health endpoint status
- vote save error rates
- auth callback error rates

## Change Management

Before shipping user-visible changes:
- update `README.md` when product behavior changes
- update `docs/KNOWLEDGE_BASE.md` when policy/rules change
- update `docs/CHANGELOG.md` for released deltas
- update `docs/WORKFLOWS.md` when runtime user journeys change
- update `docs/DESIGN_SYSTEM.md` when shared visual/state contracts change
