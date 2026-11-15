# OLX Partner API cannot search; scraping stays the discovery path

Supersedes ADR 0004. OLX granted Partner API access (scope `read write v2`), but the documented API at `https://developer.olx.pt/api/doc` exposes no cross-user search: `GET /adverts` lists only the authenticated partner's adverts and filters by `offset`, `limit`, `external_id`, `category_ids`. `client_credentials` tokens cannot post adverts; advert reads need a user-context token for that user's own adverts. Base URL `https://www.olx.pt/api/partner`, token `https://www.olx.pt/api/open/oauth/token`, headers `Authorization: Bearer` and `Version: 2.0`.

Consequence: Deal Hunter cannot obtain other sellers' listings through the API, so Playwright scraping of `olx.pt` remains the sole discovery mechanism for price comparison. The API is limited to reference data — categories, category attributes, cities, currencies — reached through `client_credentials`.

Considered: replacing scraping with API search (impossible under the granted scopes), requesting a separate search/offers product (not offered in the documentation), hybrid API + scrape (no API listing source exists to hybridise). Rejected: abandoning scraping, which would remove the product's only data source.

The scraper is now behind a `MarketplaceSource` interface (`server/utils/marketplace.ts`, implementation `olxPt` in `server/utils/olx.ts`) so a future marketplace or a future OLX search product can be added without touching callers. Listing refresh (match → upsert → snapshot) lives in `server/utils/listings.ts`, shared by the live endpoint and the hourly wishlist cron.
