# General Security, Code, and UX Audit Plan

## Scope

This audit covers:

- API and authentication security
- data consistency and vote integrity
- code quality and maintainability
- UX consistency and accessibility
- release safety and operational readiness

## Phase 1: Security Baseline and Hardening

### 1. API perimeter checks

- Verify every API route has:
  - rate limiting
  - strict input validation
  - no-cache headers
  - safe error messages (no internal details)
- Confirm high-risk endpoints (`/api/vote`, `/api/results`, `/api/auth/*`) return consistent status codes and `Retry-After` on 429.

### 2. Header and browser hardening

- Enforce global security headers:
  - `Content-Security-Policy`
  - `X-Frame-Options`
  - `X-Content-Type-Options`
  - `Referrer-Policy`
  - `Strict-Transport-Security`
  - `Permissions-Policy`
  - `Cross-Origin-Opener-Policy`
  - `Cross-Origin-Resource-Policy`
- Ensure dynamic and API responses are served with no-store semantics.

### 3. Session and auth protection

- Validate OAuth state and return URL handling.
- Ensure session cookies use secure flags in production.
- Confirm logout always clears all local auth cookies.

### 4. Abuse-resistance controls

- Verify cooldown and weight logic cannot be bypassed by refresh.
- Review anti-automation/rate controls for vote endpoints.
- Ensure in-memory limiter has bounded growth protection.

## Phase 2: Code and Architecture Audit

### 1. Validation and contracts

- Centralize request validation helpers for:
  - scope
  - pagination
  - enum params
- Keep one source of truth for tie-threshold and bloc calculation.

### 2. Reuse and duplication

- Deduplicate dashboard card rendering logic.
- Remove repeated formatting utilities where shared helpers exist.
- Consolidate repeated API response patterns.

### 3. Maintainability gates

- Enforce TypeScript strictness and lint checks in CI.
- Add change-safe utility tests for vote math and parliament estimates.

## Phase 3: UX and Design System Audit

### 1. Global design consistency

- Verify all cards use global layout tokens (spacing, radius, border, shadow, typography).
- Remove ad hoc per-component design values when a global token exists.

### 2. Content integrity rules

- Prevent duplicate labels in cards (city/county repeated in multiple blocks).
- Ensure large KPI values never wrap across lines.
- Add overflow controls for long county/city names.

### 3. Accessibility

- Check heading hierarchy and semantic sectioning.
- Verify keyboard focus order and visible focus states.
- Check color contrast for yes/no/tie palettes.

## Phase 4: Verification and Release

### 1. Test matrix

- Run:
  - `npm run build`
  - smoke checks for key routes (`/`, `/dashboard`, `/mandatumbecsles`, `/api/*`)
- Validate SSO and anonymous vote flows.

### 2. Documentation and versioning

- Update `README.md` and `docs/` with:
  - changed security behavior
  - API contract updates
  - design-system rules and constraints
- Bump version and record audit delta.

## Execution policy

- No hardcoded style or inline style for design decisions.
- No sensitive internals in production API errors.
- Every phase ends with build verification before merge.
