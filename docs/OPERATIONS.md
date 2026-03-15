# Operations Guide

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

## Security and Abuse Posture

Current protections include:
- security headers
- no-cache controls on API routes where relevant
- rate limiting for critical endpoints

Operational recommendation:
- enforce Vercel edge protections (WAF/challenge/rate controls) for traffic spikes.

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
