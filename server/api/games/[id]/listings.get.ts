import { prisma } from '../../../utils/prisma'
import { refreshListingsForGame } from '../../../utils/listings'
import { matchesNearbyLocation, resolveNearby } from '../../../utils/geo'

// S2 hide unmatched: only listings with gameId == this game, sorted cheapest first
// S4 hybrid: live scrape on empty cache + cron for wishlisted (Q3:C) + background re-scrape when served stale
// ponytail: single-IP scrape, no proxy pool — add when blocked
const REFRESH_AFTER_MS = 24 * 60 * 60 * 1000
const refreshing = new Set<string>()

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const { lat, lon } = getQuery(event) as { lat?: string; lon?: string }
  const latitude = Number(lat)
  const longitude = Number(lon)
  const nearby = lat && lon && Number.isFinite(latitude) && Number.isFinite(longitude)
    ? await resolveNearby(latitude, longitude).catch((e: any) => { console.error('[nearby]', e.message); return null })
    : null

  const cached = () => prisma.listing.findMany({
    where: { gameId: id },
    orderBy: [{ price: 'asc' }, { createdAt: 'desc' }],
    take: 50
  })
  const applyNear = (rows: any[]) => nearby ? rows.filter(l => matchesNearbyLocation(l.location, nearby.cities)) : rows

  let listings = applyNear(await cached())
  console.log(`[listings] ${id} cached=${listings.length}${nearby ? ` near=${nearby.cities.length}cities` : ''}`)
  if (listings.length === 0) {
    const game = await prisma.game.findUnique({ where: { id }, include: { platform: true } })
    if (!game) throw createError({ statusCode: 404, statusMessage: 'Game not found' })
    try {
      await refreshListingsForGame(game, { regionId: nearby?.regionId })
      listings = applyNear(await prisma.listing.findMany({ where: { gameId: id }, orderBy: [{ price: 'asc' }], take: 50 }))
    } catch (e: any) {
      console.error('[live scrape] ', e.message)
    }
  } else {
    const newest = listings.reduce((m, l) => (l.updatedAt > m ? l.updatedAt : m), listings[0].updatedAt)
    if (Date.now() - newest.getTime() > REFRESH_AFTER_MS && !refreshing.has(id)) {
      console.log(`[bg refresh] listings stale for ${id}, re-scraping in background`)
      refreshing.add(id)
      prisma.game.findUnique({ where: { id } })
        .then(game => (game ? refreshListingsForGame(game, { regionId: nearby?.regionId }) : null))
        .catch((e: any) => console.error('[bg refresh]', e.message))
        .finally(() => refreshing.delete(id))
    }
  }
  return listings
})
