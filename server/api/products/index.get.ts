import { prisma } from '../../utils/prisma'
import { serializeProduct } from '../../utils/serializers'
import type { Prisma } from '@prisma/client'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const categorySlug = typeof query.category === 'string' && query.category !== 'semua' ? query.category.trim() : undefined
  const search = typeof query.search === 'string' ? query.search.trim() : undefined
  const bestSeller = query.bestSeller === 'true'
  const featured = query.featured === 'true'
  const availableOnly = query.availableOnly === 'true'
  const sort = typeof query.sort === 'string' ? query.sort : 'popular'

  const where: Prisma.ProductWhereInput = {}

  if (categorySlug) {
    where.category = { slug: categorySlug }
  }
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { description: { contains: search } },
      { shortDescription: { contains: search } }
    ]
  }
  if (bestSeller) where.isBestSeller = true
  if (featured) where.isFeatured = true
  if (availableOnly) where.isAvailable = true

  let orderBy: Prisma.ProductOrderByWithRelationInput[] = [
    { isBestSeller: 'desc' },
    { isFeatured: 'desc' },
    { reviewCount: 'desc' }
  ]

  if (sort === 'price_asc') {
    orderBy = [{ price: 'asc' }]
  } else if (sort === 'price_desc') {
    orderBy = [{ price: 'desc' }]
  } else if (sort === 'rating') {
    orderBy = [{ rating: 'desc' }, { reviewCount: 'desc' }]
  } else if (sort === 'newest') {
    orderBy = [{ createdAt: 'desc' }]
  }

  const products = await prisma.product.findMany({
    where,
    orderBy,
    include: {
      category: { select: { id: true, name: true, slug: true } },
      images: true,
      variants: true
    }
  })

  return {
    data: products.map(serializeProduct),
    total: products.length
  }
})
