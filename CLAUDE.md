# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Deal Hunter tracks physical video-game prices on OLX.pt. The game catalog comes from RAWG; listings are scraped from OLX.pt with Playwright. Users search the catalog, mark games as watched, and compare the cheapest listings per game. Domain vocabulary and invariants live in `CONTEXT.md`; decisions in `docs/adr/`. Read both before changing data model or scraping behavior.

## Commands

```bash
npm run dev            # Nuxt dev server, http://localhost:3000
npm run build          # production build
npx playwright install chromium   # once, required for OLX scraping

npm run db:generate    # prisma generate
npm run db:push        # push schema to Neon (uses DATABASE_URL_UNPOOLED)
npm run db:migrate     # migrate dev

RAWG_API_KEY=xxx node scripts/sync-catalog.mjs   # seed platforms + games from RAWG
node scripts/refresh-wishlisted.mjs              # hourly cron: refresh listings for wishlisted games
node scripts/olx-taxonomy.mjs                    # one-off: print OLX category/attribute ids

npm test               # node:test — parser, matcher, trust score
```

No linter, formatter or CI beyond Dependabot. Verify behavior by running the dev server and the API routes; add a small `node:test` case for pure logic.

## Architecture

Nuxt full-stack (Nuxt 4, SSR off by default settings, Tailwind). No separate backend.

- **Pages** (`pages/`): `index.vue` (hero + catalog search + inline watchlist), `game/[id].vue` (cover, watchlist toggle, listings sorted cheapest-first, optional "Near me"), `wishlist.vue`, `login.vue` (redirects; auth was removed).
- **API** (`server/api/`): `GET /api/platforms` (brand-grouped), `GET /api/games?q=&platform=` (every search refreshes that title from RAWG into the DB, then reads locally), `GET /api/games/:id` (repairs a missing cover from RAWG), `GET /api/games/:id/listings?lat=&lon=`.
- **Data layer** (`server/utils/`): `prisma.ts` exports the singleton client; all routes import it. The schema is **Postgres on Neon**, reached through `@prisma/adapter-pg` (`PrismaPg`). `DATABASE_URL` is the pooled connection for the app; `DATABASE_URL_UNPOOLED` is the direct connection used by Prisma CLI commands (`db:push`, migrations) — `prisma.config.ts` picks it. Neon project/branch ids live in `.neon` (gitignored).
- **Scraping** (`server/utils/olx.ts`, `marketplace.ts`, `listings.ts`): `MarketplaceSource` is the abstraction; `olxPt` is the only implementation. Search uses the video-games category path (ADR 0007). `refreshListingsForGame` scrapes OLX search, parses bundle descriptions, matches titles/descriptions via `matchesGame`, upserts `Listing`, appends a `PriceSnapshot`, and resolves seller trust.
- **Platforms/brands** (`server/utils/brands.ts`): maps RAWG platform slugs to Sony/Microsoft/Nintendo/Sega/Atari/PC & Mobile; the sync persists `Brand` rows and `Platform.brandId`.
- **Matching & bundles** (`server/utils/matching.ts`, `bundle.ts`): normalized substring match, ignoring RAWG `(2008)` years. Lot adverts with 3+ priced lines become one `Listing` per line (`externalId = adId#lineIndex`) at the line price, not the lot price.
- **Seller trust** (`server/utils/sellerTrust.ts`): 0–100 heuristic from account age, last activity, ad count and rating; cached in the `Seller` table for 24h. Profile numbers need a Playwright render because the ad page HTML lacks them.
- **Near me** (`server/utils/geo.ts`, `olxApi.ts`): OLX partner API resolves coordinates to a region, then city centroids within 25 km (ADR 0006). The partner API is used **only** for locations and taxonomy — it cannot search other sellers' adverts (ADR 0005/0007), so scraping remains the discovery path.
- **Composables** (`composables/`): `useWishlist` is a **localStorage-only** store keyed `deal-hunter:wishlist`; there is no wishlist API. `useWishlistGames` resolves ids through `/api/games/:id`. `useImgFallback` hides broken cover images, including ones that errored pre-hydration.

## Listing freshness model

`GET /api/games/:id/listings` returns the cached 50 cheapest listings. If empty, it performs a blocking live scrape. If the newest listing is older than 24h, it re-scrapes in the background (deduped by an in-memory `Set`). `scripts/refresh-wishlisted.mjs` refreshes games that have a `WishlistEntry` row — but the UI never writes `WishlistEntry` (localStorage only), so the cron only has work when rows are seeded some other way.

## Domain invariants

- `Game` is a title **× platform**; the wishlist and price comparison point at a `Game`, never a RAWG title. Uniqueness is `(rawgId, platformId)` and `(rawgSlug, platformId)`, so one RAWG title produces one `Game` per platform.
- `Listing` is comparable only when `gameId` is set. Never surface unmatched listings in the comparison view.
- Bundle-generated listings share the advert URL but have distinct `externalId`s and line prices; cleanup deletes lines removed from the advert.

## Conventions

- Tailwind design tokens are defined as `@theme` variables in `assets/css/tailwind.css` (`--color-primary`, `--color-commerce`, `--color-ink`, `--color-body`, `--color-mute`, `--color-ash`, `--color-hairline`, `--color-surface-card`, `--font-display`, `--font-body`). Use them instead of raw hex values.
- Tailwind 4 is wired through `@tailwindcss/vite` in `nuxt.config.ts`; there is no `tailwind.config.js`.
- The codebase uses `// ponytail:` comments for deliberate shortcuts and upgrade triggers. Keep that style when deferring a known limit.
