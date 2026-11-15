// hourly cron: refresh listings only for games in at least one wishlist (S4 hybrid)
// Q2:A Playwright, Q3:C hybrid (cron + live), Q4:A single-IP, Q5:B full fields
// ponytail: sequential per game — parallelize with pLimit if wishlist >100
import { PrismaClient } from '@prisma/client'
import { scrapeOlxListings, matchesGame } from '../server/utils/olx.ts'
const prisma = new PrismaClient()
const games = await prisma.game.findMany({ where: { wishlistEntries: { some: {} } }, include: { platform: true } })
for (const g of games) {
  const q = g.name.replace(/[:/]/g, ' ').trim()
  const scraped = await scrapeOlxListings(q, 20).catch(e => { console.error(g.name, e.message); return [] })
  for (const s of scraped) {
    if (!matchesGame(s.title, g.name) && !matchesGame(s.description || '', g.name)) continue // S2 hide unmatched, now title+description
    const up = await prisma.listing.upsert({
      where: { marketplace_externalId: { marketplace: 'olx_pt', externalId: s.externalId } },
      create: { externalId: s.externalId, marketplace: 'olx_pt', title: s.title, price: s.price, currency: s.currency, condition: s.condition, url: s.url, imageUrl: s.imageUrl, location: s.location, gameId: g.id },
      update: { price: s.price, title: s.title, url: s.url, imageUrl: s.imageUrl, location: s.location }
    })
    await prisma.priceSnapshot.create({ data: { listingId: up.id, price: up.price } }).catch(() => {})
  }
}
console.log(`refreshed ${games.length} games`)
await prisma.$disconnect()
