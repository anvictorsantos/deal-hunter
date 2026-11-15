import { prisma } from '../../../utils/prisma'
import { scrapeOlxListings, matchesGame } from '../../../utils/olx'

// S2 hide unmatched: only listings with gameId == this game, sorted cheapest first
// S3 badge: no condition filter, just badge in UI
// S4 hybrid: live scrape on first view if cache empty + cron for wishlisted (Q3:C)
// ponytail: single-IP scrape, no proxy pool — add when blocked
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  let listings = await prisma.listing.findMany({
    where: { gameId: id },
    orderBy: [{ price: 'asc' }, { createdAt: 'desc' }],
    take: 50
  })
  console.log(`[listings] ${id} cached=${listings.length}`)
  if (listings.length === 0) {
    const game = await prisma.game.findUnique({ where: { id }, include: { platform: true } })
    if (!game) throw createError({ statusCode: 404, statusMessage: 'Game not found' })
    try {
      // ponytail: query without platform — "Xbox Series S/X" with slash kills olx search (scraped=0). Use title only.
      const query = game.name.replace(/[:/]/g, ' ').trim()
      console.log(`[live scrape] query="${query}" for game="${game.name}"`)
      const scraped = await scrapeOlxListings(query, 20)
      console.log(`[live scrape] scraped=${scraped.length} titles=${scraped.slice(0,3).map(s=>s.title).join(' | ')}`)
      let matched = 0
      for (const s of scraped) {
        const inTitle = matchesGame(s.title, game.name)
        const inDesc = matchesGame(s.description || '', game.name)
        const ok = inTitle || inDesc
        if (!ok) { console.log(`[matcher] skip "${s.title}" (desc ${inDesc ? 'hit' : 'miss'})`); continue }
        if (inDesc && !inTitle) console.log(`[matcher] bundle hit via description: "${s.title}" -> "${(s.description || '').slice(0,80)}..."`)
        matched++
        const up = await prisma.listing.upsert({
          where: { marketplace_externalId: { marketplace: 'olx_pt', externalId: s.externalId } },
          create: { externalId: s.externalId, marketplace: 'olx_pt', title: s.title, price: s.price, currency: s.currency, condition: s.condition, url: s.url, imageUrl: s.imageUrl, location: s.location, gameId: id },
          update: { price: s.price, title: s.title, url: s.url, imageUrl: s.imageUrl, location: s.location }
        })
        await prisma.priceSnapshot.create({ data: { listingId: up.id, price: up.price } }).catch(() => {})
      }
      console.log(`[live scrape] matched=${matched} -> listings now`)
      listings = await prisma.listing.findMany({ where: { gameId: id }, orderBy: [{ price: 'asc' }], take: 50 })
    } catch (e: any) {
      console.error('[live scrape] ', e.message)
    }
  }
  return listings
})
