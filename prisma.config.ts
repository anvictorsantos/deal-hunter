import 'dotenv/config'
import path from 'node:path'
import { defineConfig } from 'prisma/config'

// .env's relative file: URL followed old Prisma behavior (schema-dir relative); config resolves against cwd
const dbUrl = process.env.DATABASE_URL!.replace(/^file:/, '')
const fileUrl = path.isAbsolute(dbUrl) ? `file:${dbUrl}` : `file:./prisma/${dbUrl}`

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: fileUrl,
  },
})
