# Postgres over Mongo for catalog and wishlist

We chose Postgres (via Supabase, Prisma/Drizzle) over Mongo despite the original "MAVN" implying Mongo. The domain is relational: Brand → Platform → Game → Listing → WishlistEntry with joins for cheapest-per-game queries. Those are one-line SQL (`GROUP BY game_id, min(price)`) and painful aggregations in Mongo. Postgres also gives us text search, foreign keys for wishlist integrity, and Supabase Auth for free.

Considered: Mongo (flexible for scraped blobs), Mongo+Postgres hybrid. Rejected because comparison (the core feature) is inherently relational.
