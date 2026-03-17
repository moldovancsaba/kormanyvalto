# Security Guide

## Security Priority

- User UX and user journey are the number 1 priority.
- `Kormanyvalto` is a critical app and must keep core user flows available whatever happens.
- Security controls must protect the system without breaking normal-user access.
- On the critical path, prefer fail-open or degraded-mode behavior for auxiliary security services unless failing closed is absolutely required to prevent catastrophic abuse.

## Adaptive Abuse Controls

The application uses low-friction abuse controls instead of CAPTCHA:

- signed anonymous actor cookies,
- trust-aware vote cooldowns,
- multi-key rate limiting (fingerprint, IP, subnet, actor, scope),
- edge bot-score intake when the hosting layer provides it,
- anomaly event logging in MongoDB (`abuse_events`).

## Edge Protection

Recommended production setup:

- enable Vercel WAF / bot-management style protections in monitor or challenge-free modes,
- forward bot/risk headers from the edge layer,
- prefer preserving source IP headers from the platform,
- avoid stripping `Origin` / `Referer` on first-party browser traffic.

Headers currently consumed when available:

- `x-verified-bot-score`
- `x-bot-score`
- `cf-bot-score`
- `x-vercel-ip-country`
- `cf-ipcountry`
- `x-forwarded-for`

## Trust Levels

Vote requests are internally classified as:

- `trusted`
- `standard`
- `suspicious`
- `restricted`

The UI remains unchanged. The trust level only affects server-side pacing and anomaly logging.

Current policy model:

- `trusted`: slightly lighter cooldown and larger actor budget
- `standard`: default vote policy
- `suspicious`: longer cooldown and smaller actor budget
- `restricted`: deny votes and raise reputation score

Trust decisions are not request-local only. They also incorporate persistent reputation from the `abuse_reputation` collection with time decay.

## Anomaly Telemetry

Suspicious traffic is written to the `abuse_events` collection.

Persistent reputation is stored in:

- `abuse_reputation`

Typical event classes:

- `abuse-score`
- `vote-anomaly`

Operationally, monitor:

- spikes in `restricted` trust decisions,
- bursts concentrated on one scope,
- rapid anonymous actor churn,
- mismatches between total vote growth and unique actor growth.
