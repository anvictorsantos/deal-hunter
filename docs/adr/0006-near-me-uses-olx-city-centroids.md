# "Near me" filters by OLX city centroids within 25 km

Listing rows carry only a free-text location (`"Arroios - Para o topo hoje às 18:18"`) and no coordinates, and the Partner API cannot search other sellers' adverts (ADR 0005). "Near me" therefore resolves the browser's coordinates with `GET /api/partner/locations` to a region, loads that region's cities from `GET /api/partner/cities`, keeps cities whose centroid is within 25 km of the user, and filters listings by exact city-name match on the location prefix. The live scrape adds `?search[region_id]=<id>` so the fetch is region-bounded before filtering; cached listings are filtered first and a region scrape runs only when nothing nearby is cached.

Considered: geocoding each listing's location text and computing per-listing distance (accurate, but adds a geocoder and a lookup per listing); `search[city_id]` / `search[district_id]` (tested — olx.pt web search ignores both, `search[region_id]` is the only geo param that filters); district-level scope (coarser than "near me").

Trade-off: city-centroid matching misses listings posted under a neighbouring parish name and cannot order by exact distance. The 25 km radius is a constant, not a user-facing control.
