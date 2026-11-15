import { prisma } from '../../utils/prisma'
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const g = await prisma.game.findUnique({ where: { id }, include: { platform: true } })
  if (!g) throw createError({ statusCode: 404, statusMessage: 'Game not found' })
  return { id: g.id, rawgId: g.rawgId, name: g.name, coverImage: g.coverImage, platformName: g.platform.name, platformSlug: g.platform.slug }
})
