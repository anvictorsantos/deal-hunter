import { prisma } from '../utils/prisma'
import { BRAND_ORDER, brandForSlug } from '../utils/brands'

export default defineEventHandler(async () => {
  const platforms = await prisma.platform.findMany({
    where: { gamesCount: { gt: 0 } },
    include: { brand: true },
  })
  return platforms
    .map(p => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      gamesCount: p.gamesCount,
      brandName: p.brand?.name ?? brandForSlug(p.slug),
    }))
    .sort((a, b) =>
      BRAND_ORDER.indexOf(a.brandName as any) - BRAND_ORDER.indexOf(b.brandName as any) ||
      a.name.localeCompare(b.name))
})
