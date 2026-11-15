# Nuxt 3 full-stack with Supabase Auth and REST over GraphQL

We chose Nuxt 3 (Vue) as a single full-stack app — frontend + REST API in `/server/api` — with Supabase for Postgres + Auth, and plain REST over GraphQL/tRPC. GraphQL adds schema, resolvers, and batching on top of already-unstable marketplace data for a single web client; REST (`GET /games`, `GET /games/:id/listings`, `GET /wishlist`) is enough for MVP. Nuxt + `@nuxtjs/supabase` gives us auth in one module; splitting Express + Vite would double deploys for no gain.

Considered: Next.js, separate Express API, GraphQL (single fan-out resolver for OLX+eBay), tRPC. Rejected: GraphQL/tRPC payoff only with multiple clients; separate API server is overhead for 2-3 week MVP.
