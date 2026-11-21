import { refreshStaleGames } from '../../utils/listings'

export default defineEventHandler(async (event) => {
  const secret = useRuntimeConfig(event).cronSecret || process.env.CRON_SECRET
  if (!secret || getHeader(event, 'x-cron-secret') !== secret) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid cron secret' })
  }
  const limit = Math.min(Number(getQuery(event).limit) || 10, 25)
  const refreshed = await refreshStaleGames(limit)
  return { refreshed }
})
