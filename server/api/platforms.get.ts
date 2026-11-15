import { prisma } from '../utils/prisma'
export default defineEventHandler(async () => {
  const platforms = await prisma.platform.findMany({
    where: { gamesCount: { gt: 200 } },
    orderBy: { gamesCount: 'desc' }
  })
  return platforms
})
