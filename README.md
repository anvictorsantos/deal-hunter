<p align="center">
  <img src="assets/image/logo.png" width="360" alt="Deal Hunter logo" />
</p>

<h1 align="center">Deal Hunter</h1>

<p align="center">
  <strong>Physical game deals across Portugal, tracked hourly.</strong><br />
  Search the RAWG catalog, watch the games you care about, compare the cheapest OLX.pt listings first.
</p>

Nuxt 3 + Tailwind + Supabase (Postgres + Auth) + Prisma + REST. RAWG catalog + OLX.pt scraping via Playwright (Portugal). eBay deferred, alerts deferred. See ADR 0005 (partner API cannot search; scraping stays discovery).

## Glossary
See `CONTEXT.md`. Core: `Brand → Platform → Game (title×platform) → Listing → PriceSnapshot`, `User → Wishlist → WishlistEntry`. Decisions in `docs/adr/`.

## Setup
```bash
cp .env.example .env   # fill DATABASE_URL, SUPABASE_*, RAWG_API_KEY, OLX_CLIENT_ID, OLX_CLIENT_SECRET
npm install
npx playwright install chromium  # first time only — for OLX scraping
npx prisma db push     # or migrate dev
npm run dev            # http://localhost:3000
```

## Seed catalog
```bash
RAWG_API_KEY=xxx node scripts/sync-catalog.mjs
```

## Cron (hourly)
`.github/workflows/refresh-listings.yml` calls `POST /api/cron/refresh` every hour. The endpoint refreshes wishlisted games first, then the 10 coldest cached games (one batch per call).

Required GitHub repository secrets:
- `APP_URL` — deployed origin, no trailing slash (e.g. `https://deal-hunter.onrender.com`)
- `CRON_SECRET` — same value as the server's `CRON_SECRET`

Run it manually:
```bash
CRON_SECRET=xxx node scripts/refresh-wishlisted.mjs   # CRON_BATCH=20 to change the batch
```

## Routes
- `GET /api/platforms` — platforms with gamesCount>200
- `GET /api/games?q=&platform=` — catalog search
- `GET /api/games/:id` — one game
- `GET /api/games/:id/listings` — cheapest first, live-fetch if empty; `?lat=&lon=` keeps only listings within 25 km (ADR 0006)
- `GET/POST/DELETE /api/wishlist` — auth required (Supabase)
