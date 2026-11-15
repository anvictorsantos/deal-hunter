# Deal Hunter

Nuxt 3 + Tailwind + Supabase (Postgres + Auth) + Prisma + REST. RAWG catalog + OLX.pt scraping via Playwright (Portugal). eBay deferred, alerts deferred. See ADR 0004 (scraping supersedes API).

## Glossary
See `CONTEXT.md`. Core: `Brand → Platform → Game (title×platform) → Listing → PriceSnapshot`, `User → Wishlist → WishlistEntry`. Decisions in `docs/adr/`.

## Setup
```bash
cp .env.example .env   # fill DATABASE_URL, SUPABASE_*, RAWG_API_KEY (no OLX creds needed)
npm install
npx playwright install chromium  # first time only — for OLX scraping
npx prisma db push     # or migrate dev
npm run dev            # http://localhost:3000
```

## Seed catalog
```bash
RAWG_API_KEY=xxx node scripts/sync-catalog.mjs
```

## Cron (hourly, wishlisted only)
```bash
node scripts/refresh-wishlisted.mjs  # wire to cron / GitHub Actions / Supabase cron
```

## Routes
- `GET /api/platforms` — platforms with gamesCount>200
- `GET /api/games?q=&platform=` — catalog search
- `GET /api/games/:id` — one game
- `GET /api/games/:id/listings` — cheapest first, live-fetch if empty
- `GET/POST/DELETE /api/wishlist` — auth required (Supabase)
