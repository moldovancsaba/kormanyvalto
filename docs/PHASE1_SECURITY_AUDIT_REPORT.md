# Phase 1 Security Audit Report

Date: 2026-03-15  
Scope: `kormanyvalto.com` Next.js app API perimeter and auth/vote flows

## Completed hardening changes

### 1. Global security headers

- Added:
  - `Content-Security-Policy`
  - `Cross-Origin-Opener-Policy`
  - `Cross-Origin-Resource-Policy`
- Kept and verified:
  - `X-Frame-Options`
  - `X-Content-Type-Options`
  - `Referrer-Policy`
  - `Permissions-Policy`
  - `Strict-Transport-Security`

File: `/next.config.mjs`

### 2. API input validation

- Added centralized request validators for:
  - vote/results scope validation
  - pagination normalization and bounds

File: `/src/lib/requestValidation.ts`

### 3. Vote endpoint abuse checks

- Added trusted-origin guard for `POST /api/vote`.
- Added strict JSON content-type requirement for `POST /api/vote`.
- Hardened error handling to avoid internal message leakage.

File: `/src/app/api/vote/route.ts`

### 4. Authentication endpoint throttling

- Added rate-limits to:
  - `GET /api/auth/login`
  - `GET /api/auth/callback`
  - `GET /api/auth/logout`
  - `GET /api/auth/session`

Files:
- `/src/app/api/auth/login/route.ts`
- `/src/app/api/auth/callback/route.ts`
- `/src/app/api/auth/logout/route.ts`
- `/src/app/api/auth/session/route.ts`

### 5. Public API throttling and validation

- Added rate-limit and bounded pagination to `GET /api/city-cards`.
- Added strict scope validation to `GET /api/results`.
- Existing limits retained on `GET /api/health`.

Files:
- `/src/app/api/city-cards/route.ts`
- `/src/app/api/results/route.ts`

### 6. Error-surface minimization

- Removed internal DB name and raw error message from health responses.

File: `/src/app/api/health/route.ts`

### 7. In-memory rate-limit resilience

- Added bounded cleanup logic for limiter bucket map to avoid unbounded memory growth.

File: `/src/lib/rateLimit.ts`

## Verification

- `npm run build` passes after hardening.

## Residual risks (Phase 2 candidates)

- In-memory rate limiting is per-instance. Multi-instance deployments need shared backing store for strict global enforcement.
- No dedicated API-level integration test suite yet for abuse/validation paths.
- CSP currently allows `'unsafe-inline'` due to current script/style patterns. This can be reduced after script refactor.

## Phase 2 recommended next actions

1. Add shared/distributed rate-limit backend (Redis or managed equivalent).
2. Add API integration tests for 400/403/415/429 branches.
3. Reduce CSP inline allowances where possible.
4. Add structured security event logging for abuse patterns.
