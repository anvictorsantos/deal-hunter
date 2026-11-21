import 'dotenv/config'
import { refreshStaleGames } from '../server/utils/listings.ts'
import { prisma } from '../server/utils/prisma.ts'

const refreshed = await refreshStaleGames(Number(process.env.CRON_BATCH ?? 10))
console.log(`refreshed ${refreshed} games`)
await prisma.$disconnect()
