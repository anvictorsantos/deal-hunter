# Scrape OLX.pt with Playwright — supersedes API-first (ADR 0003)

Supersedes ADR 0003. OLX.pt API approval/fit was blocking MVP (Q1:A), so we revert to web scraping for OLX.pt. Playwright renders the React + Cloudflare page (Cheerio fails); hybrid refresh per S4 — live scrape on first Game view if cache empty + hourly cron only for wishlisted games. Single-IP scraping for MVP (`ponytail: no proxy rotation until blocked`). Full fields (title, price, currency, condition, location, image, url) are extracted; cheapest-first ordering is unchanged (S3 badge).

Considered: keep API, hybrid API+scrape. Rejected: API not viable for init; scraping alone unblocks build today. API code kept as reference but not wired.
