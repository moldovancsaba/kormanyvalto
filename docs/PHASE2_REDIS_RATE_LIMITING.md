# Phase 2: Redis-backed Durable Rate Limiting

## What Upstash Redis is

Upstash Redis is a hosted Redis service. In this app it is used as a shared rate-limit store.

Why it matters:

- the current app can run on multiple server instances
- in-memory rate limits only protect one instance at a time
- Redis gives one shared counter store across all instances
- this makes vote throttling durable and much harder to bypass

## What this phase changes

The app now supports two rate-limit backends:

1. `redis`
2. `memory` fallback

If Redis env vars are present, the API uses Redis.
If Redis env vars are missing, the app falls back to the existing in-memory limiter.

## Required environment variables

Add these in Vercel:

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

## What to create in Upstash

1. Create one Redis database.
2. Copy the REST URL.
3. Copy the REST token.
4. Put both values into Vercel project environment variables.
5. Redeploy.

## What is protected now

These routes now use the durable limiter when Redis is configured:

- `/api/vote`
- `/api/results`
- `/api/list-preview`
- `/api/city-cards`
- `/api/auth/login`
- `/api/auth/callback`
- `/api/auth/logout`
- `/api/auth/session`
- `/api/health`

## Current keying strategy

The limiter builds a fingerprint from:

- client IP
- user agent
- accept-language

This is hashed before storage and used as the route bucket key.

## Why this is only Phase 2

Redis-backed limits are a strong improvement, but they are not the full anti-abuse stack.

Next phases:

1. vote nonce
2. app-side suspicion scoring
3. edge/WAF limits before the app

## Operational note

If Redis becomes unavailable, the app still works and falls back to in-memory limits.
That is intentional so voting does not go fully offline because of one infrastructure dependency.
