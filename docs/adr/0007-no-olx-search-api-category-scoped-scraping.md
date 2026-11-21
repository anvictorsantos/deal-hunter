# ADR 0007: No OLX search endpoint; scrape a category-scoped web search

- Status: Accepted
- Date: 2026-11-21

## Context

The OLX partner API documentation (`https://developer.olx.pt/api/doc`) exposes users, own adverts, threads, categories, cities, attributes and billing. There is no endpoint to search other sellers' adverts by title, description or category. `GET /adverts` lists only the authenticated client's adverts; `GET /users/{id}` returns only id, name and avatar.

The web search accepts a category path. `/d/q-{query}/?search[category_id]=4923` returns zero cards, while `/tecnologia-e-informatica/videojogos-consolas/videojogos/q-{query}/` returns only video-game adverts.

## Decision

Keep Playwright scraping as the listing discovery path (ADR 0004, 0005). Scope every search to the video-games category path (`OLX_CATEGORY_VIDEOJOGOS` = 4923) instead of the site-wide search.

## Consequences

- False positives such as laptops and books matching "Dead Space" no longer enter the scrape.
- The category path is site markup, not API contract; it can change without notice. Keep the taxonomy script as the way to re-resolve category ids.
- Search is still limited to the first result page and a single IP.
