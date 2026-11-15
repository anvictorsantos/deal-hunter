import path from 'node:path'
import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'

// Prisma resolved relative file: URLs against prisma/ (schema dir); better-sqlite3 resolves against cwd — keep the old behavior
function sqlitePath(fileUrl: string) {
  const p = fileUrl.replace(/^file:/, '')
  return path.isAbsolute(p) ? p : path.join('prisma', p)
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: sqlitePath(process.env.DATABASE_URL!) }) })
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
