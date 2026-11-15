import { PrismaClient } from '@prisma/client'
import { syncPlatformsAndGames } from '../server/utils/rawg.ts'
const prisma = new PrismaClient()
const key = process.env.RAWG_API_KEY
if (!key) { console.error('RAWG_API_KEY missing'); process.exit(1) }
await syncPlatformsAndGames(key, prisma)
console.log('catalog sync done')
await prisma.$disconnect()
