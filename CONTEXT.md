# Deal Hunter

Aggregates physical video-game listings for Portugal. Canonical games come from RAWG; live offers are scraped from marketplaces (OLX.pt for MVP via Playwright, eBay deferred). Lets authenticated users search by game, browse by platform, save to a wishlist, and compare the cheapest listing per game.

## Language

### Catalog

**Game**: A specific title on a specific platform (e.g. "The Witcher 3 — PS4"). The unit the wishlist and price comparison point to. One RAWG game can produce multiple Games if it ships on multiple platforms.
_Avoid_: Title, DVD, product

**Platform**: A console/system that runs games (e.g. PS4, PS5, Switch, Xbox Series X). Sourced from RAWG, filtered by popularity for MVP.
_Avoid_: Console, system (when used loosely)

**Brand**: The maker that owns one or more platforms (e.g. Sony → PS4/PS5, Nintendo → Switch/Switch 2).
_Avoid_: Manufacturer, publisher

### Marketplace

**Marketplace**: An external site where listings are published (e.g. OLX.pt). The source of truth for price; Deal Hunter never sets a price. For MVP, listings are obtained by scraping the marketplace's HTML with Playwright (single-IP, no proxy).
_Avoid_: Platform (when you mean OLX/eBay), provider

**Listing**: A single offer on a marketplace — title, price, currency, condition, URL, image, location, and the marketplace that published it. Always linked to a Game when matched; unmatched listings are not comparable.
_Avoid_: Ad, post, offer, product

**PriceSnapshot**: The price of a listing at the time it was fetched. History of snapshots lets us detect drops without re-scraping logic.
_Avoid_: Price history, price point

### User & Interaction

**User**: An authenticated person (via Supabase Auth). Owns wishlists; anonymous visitors can browse/search but cannot save.
_Avoid_: Customer, account

**Wishlist**: The per-user collection of Games they want to track. One wishlist per user for MVP.
_Avoid_: Wish list, favorites, saved games

**WishlistEntry**: A single Game inside a user's wishlist, with the date it was added. The cron only refreshes listings for games that appear in at least one wishlist.
_Avoid_: Wishlist item, saved item

**Search**: Querying the canonical catalog (RAWG) by title, optionally filtered by platform. Searching never hits marketplaces directly; listings are fetched after a Game is selected.
_Avoid_: Marketplace search, live search

### Comparison

**Comparison**: For one Game, the set of its Listings across marketplaces ordered by total price (lowest first). MVP compares listings *within* OLX.pt (multiple sellers for same game); cross-marketplace comparison is v2 when eBay returns.
_Avoid_: Price comparison (when you mean the view), cross-platform pricing
