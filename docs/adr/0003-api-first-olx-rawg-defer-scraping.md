# API-first (RAWG + OLX.pt API) and defer scraping and alerts

We chose RAWG as the canonical catalog (Game + Platform) and OLX.pt API (OAuth2) as the sole marketplace for MVP, deferring HTML scraping and eBay Browse API to v2. RAWG gives us stable IDs, covers, and platform taxonomy so listings can be matched to a Game — without it, price comparison is string-matching noise. OLX.pt's documented API avoids Cloudflare/ToS/brittleness of scraping `olx.pt` HTML, which breaks every few weeks. Alerts (email + in-app) are deferred to v2; MVP only refreshes listings for wishlisted games via hourly cron.

Considered: Cheerio/Playwright scraping day one, eBay API first, cross-marketplace comparison in MVP. Rejected: scraping + catalog-matching together is the highest-risk combo; shipping one stable marketplace end-to-end proves the model before adding a second source.
