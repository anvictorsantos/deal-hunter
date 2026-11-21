import 'dotenv/config'
import { defineConfig } from 'prisma/config'

// Migrations and db push go over the direct (unpooled) connection; PgBouncer
// in transaction mode breaks Prisma's session-level statements.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL!,
  },
})
