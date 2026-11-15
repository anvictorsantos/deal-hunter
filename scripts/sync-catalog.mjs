import 'dotenv/config'
import { prisma } from '../server/utils/prisma.ts'
import { syncPlatformsAndGames } from '../server/utils/rawg.ts'
const key = process.env.RAWG_API_KEY
if (!key) { console.error('RAWG_API_KEY missing'); process.exit(1) }
await syncPlatformsAndGames(key, prisma)
console.log('catalog sync done')
await prisma.$disconnect()
