import { prisma } from '../../../utils/prisma'
import { requireAdmin } from '../../../utils/auth'
import { serializeProduct } from '../../../utils/serializers'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const query = getQuery(event)
  const search = typeof query.search === 'string' ? query.search.trim() : undefined
  const categoryId = typeof query.categoryId === 'string' && query.categoryId ? query.categoryId : undefined

  const products = await prisma.product.findMany({
    where: {
      ...(categoryId ? { categoryId } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search } },
              { sku: { contains: search } }
            ]
          }
        : {})
    },
    orderBy: [{ createdAt: 'desc' }],
    include: {
      category: { select: { id: true, name: true, slug: true } },
      images: true,
      variants: true
    }
  })

  return {
    data: products.map(serializeProduct)
  }
})
