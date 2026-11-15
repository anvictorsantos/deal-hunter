import { prisma } from '../../../utils/prisma'
import { refreshListingsForGame } from '../../../utils/listings'

// S2 hide unmatched: only listings with gameId == this game, sorted cheapest first
// S4 hybrid: live scrape on empty cache + cron for wishlisted (Q3:C) + background re-scrape when served stale
// ponytail: single-IP scrape, no proxy pool — add when blocked
const REFRESH_AFTER_MS = 24 * 60 * 60 * 1000
const refreshing = new Set<string>()

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
      await refreshListingsForGame(game)
      listings = await prisma.listing.findMany({ where: { gameId: id }, orderBy: [{ price: 'asc' }], take: 50 })
    } catch (e: any) {
      console.error('[live scrape] ', e.message)
    }
  } else {
    const newest = listings.reduce((m, l) => (l.updatedAt > m ? l.updatedAt : m), listings[0].updatedAt)
    if (Date.now() - newest.getTime() > REFRESH_AFTER_MS && !refreshing.has(id)) {
      console.log(`[bg refresh] listings stale for ${id}, re-scraping in background`)
      refreshing.add(id)
      prisma.game.findUnique({ where: { id } })
        .then(game => (game ? refreshListingsForGame(game) : null))
        .catch((e: any) => console.error('[bg refresh]', e.message))
        .finally(() => refreshing.delete(id))
    }
  }
  return listings
})
