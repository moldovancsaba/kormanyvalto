# Kormanyvalto

![Hero](./public/images/hero.png)

Kormanyvalto is a Next.js election-style voting app focused on simple yes/no interaction for Hungarian OGY 2026 constituency pages.

## What The App Does

- Shows a yes/no vote UI with a barometer (`igen` vs `nem`)
- Persists and displays vote history with source labels
- Supports scope-based voting:
  - `Országos` (main page)
  - county pages
  - individual constituency pages
- Includes hierarchical navigation:
  - country list -> county -> constituency vote page
- Shows county and constituency barometers in list buttons
- Uses MongoDB Atlas as backend storage

## Main Routes

- `/` -> Országos vote page
- `/ogy2026/egyeni-valasztokeruletek` -> county selector (with county summed barometers)
- `/ogy2026/egyeni-valasztokeruletek/[maz]` -> constituency list for county
- `/ogy2026/egyeni-valasztokeruletek/[maz]/[evk]` -> constituency vote page

## Voting And Cooldown Logic

- Buttons: `igen` and `nem`
- Cooldown is user-local and refresh-safe via `localStorage`
- Cooldown progression per scope:
  - first click: `1.0s`
  - each subsequent click: `+0.3s`
- The countdown continues after browser refresh

## Data Model (MongoDB)

Collection: `votes`

Stored fields per vote:

- `scope`: voting scope (`main` or constituency path)
- `type`: `yes` or `no`
- `timestamp`: ISO date-time string

## API Endpoints

- `GET /api/results?scope=...&aggregate=1|0`
  - returns vote counts/history for a scope
  - `aggregate=1` on `main` returns all scopes for national summary/history
- `POST /api/vote`
  - body: `{ type: "yes" | "no", scope?: string }`
- `GET /api/health`
  - DB health check

## Security And Abuse Protection

App-level protections included:

- Security headers (`X-Frame-Options`, `nosniff`, HSTS, etc.)
- API no-cache headers
- In-process rate limiting on API routes
- EEA consent mode flow for analytics

Important: for serious DDoS resistance, enable edge/CDN protections in hosting (Vercel Firewall/WAF/challenge/rate-limits).

## Analytics / Tracking

Configured:

- Google Analytics (`gtag`) with Consent Mode v2 default denied in EEA
- Google Tag Manager (`GTM-PM46B3TD`)
- Consent banner with accept/deny choice

## Social Share

Open Graph and Twitter cards are configured in metadata.

Social share image:

- `public/social-share-2026.png`

## Tech Stack

- Next.js App Router
- React
- TypeScript
- MongoDB Atlas
- Deployed on Vercel

## Local Development

### 1. Install

```bash
npm install
```

### 2. Environment Variables

Set at least:

- `MONGODB_URI` (required)
- `MONGODB_DB` (recommended explicit DB name)

### 3. Run

```bash
npm run dev
```

### 4. Build Check

```bash
npm run build
```

## Deploy On Vercel

1. Fork this repository
2. Import your fork in Vercel
3. Set environment variables:
   - `MONGODB_URI`
   - `MONGODB_DB` (recommended)
4. Deploy
5. Verify:
   - `/api/health`
   - main vote page
   - county list and constituency pages

## Forking To Build Your Own Election System

To adapt this for your own election/campaign:

1. Replace constituency dataset (`src/lib/constituencies.ts`)
2. Adjust route hierarchy if needed (country/region/district)
3. Update branding assets:
   - `public/images/hero.png`
   - `public/social-share-2026.png`
4. Update metadata in `src/app/layout.tsx`
5. Tune cooldown, limits, and barometer behavior in `src/components/VoteWidget.tsx`
6. Tune API limits/security in:
   - `src/lib/rateLimit.ts`
   - `next.config.mjs`

## Project Notes

- Pages use shared design tokens from `src/app/globals.css`
- County and district selector pages use ISR refresh (`15 minutes`)
- Voting pages are scope-aware and share one backend collection

