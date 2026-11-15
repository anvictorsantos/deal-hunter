// hourly cron: refresh listings only for games in at least one wishlist (S4 hybrid)
// ponytail: sequential per game — parallelize with pLimit if wishlist >100
import 'dotenv/config'
import { prisma } from '../server/utils/prisma.ts'
import { refreshListingsForGame } from '../server/utils/listings.ts'

const games = await prisma.game.findMany({ where: { wishlistEntries: { some: {} } }, include: { platform: true } })
for (const g of games) {
  await refreshListingsForGame(g).catch(e => { console.error(g.name, e.message); return 0 })
}
console.log(`refreshed ${games.length} games`)
await prisma.$disconnect()
