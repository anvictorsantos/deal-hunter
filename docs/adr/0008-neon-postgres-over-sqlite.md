# Neon Postgres instead of local SQLite (supersedes the SQLite data layer)

The local SQLite file (`prisma/dev.db`, `@prisma/adapter-better-sqlite3`) did not survive Render deploys without a paid persistent disk, and the disk was the only durable store for the whole app. Move the database to Neon Postgres: `@prisma/adapter-pg` (`PrismaPg`, node-postgres pool) for the app over the pooled connection, `DATABASE_URL_UNPOOLED` for Prisma CLI (`db:push`, migrations) via `prisma.config.ts`. Connection strings come from `.neon` / `neon deploy`, never committed.

Postgres `contains` is case-sensitive, so the catalog search got `mode: 'insensitive'` (SQLite `LIKE` was already case-insensitive). Existing SQLite rows are not migrated: the catalog reseeds from RAWG (`scripts/sync-catalog.mjs`) and listings regenerate from OLX on demand. Render no longer needs a disk; the free plan is enough.

Considered: keep SQLite on the Render disk, or Supabase Postgres. Rejected: the disk requires a paid instance and locks the DB to one host; Supabase was only the historical auth choice (auth removed), and Neon is the org's existing provider.
