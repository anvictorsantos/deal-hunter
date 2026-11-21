import { prisma } from '../../utils/prisma'

async function repairCover(event: any, id: string, rawgId: number) {
  const key = useRuntimeConfig(event).rawgApiKey || process.env.RAWG_API_KEY
  if (!key) return null
  try {
    const res = await fetch(`https://api.rawg.io/api/games/${rawgId}?key=${key}`, { signal: AbortSignal.timeout(10000) })
    if (!res.ok) return null
    const json: any = await res.json()
    const cover = json.background_image ?? null
    if (cover) await prisma.game.update({ where: { id }, data: { coverImage: cover } })
    return cover
  } catch {
    return null
  }
}

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const g = await prisma.game.findUnique({ where: { id }, include: { platform: true } })
  if (!g) throw createError({ statusCode: 404, statusMessage: 'Game not found' })

  const coverImage = g.coverImage || await repairCover(event, g.id, g.rawgId)
  return { id: g.id, rawgId: g.rawgId, name: g.name, coverImage, platformName: g.platform.name, platformSlug: g.platform.slug }
})
