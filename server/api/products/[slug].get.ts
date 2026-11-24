import { prisma } from '../../utils/prisma'
import { serializeProduct } from '../../utils/serializers'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) {
    throw createError({ statusCode: 400, statusMessage: 'Slug produk tidak valid.' })
  }

  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      images: true,
      variants: true
    }
  })

  if (!product) {
    throw createError({ statusCode: 404, statusMessage: 'Menu tidak ditemukan.' })
  }

  const related = await prisma.product.findMany({
    where: {
      categoryId: product.categoryId,
      id: { not: product.id },
      isAvailable: true
    },
    take: 4,
    include: {
      category: { select: { id: true, name: true, slug: true } },
      images: true,
      variants: true
    }
  })

  return {
    data: serializeProduct(product),
    related: related.map(serializeProduct)
  }
})
