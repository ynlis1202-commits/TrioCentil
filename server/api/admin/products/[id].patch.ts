import { prisma } from '../../../utils/prisma'
import { requireAdmin } from '../../../utils/auth'
import { productUpsertSchema } from '../../../utils/validation'
import { serializeProduct } from '../../../utils/serializers'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID produk tidak valid.' })
  }

  const existing = await prisma.product.findUnique({
    where: { id },
    include: { images: true }
  })
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Produk tidak ditemukan.' })
  }

  const body = await readBody(event)
  const parsed = productUpsertSchema.partial().safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues[0]?.message || 'Data pembaruan produk tidak valid.'
    })
  }

  const input = parsed.data

  const updated = await prisma.$transaction(async (tx) => {
    if (input.imageUrl) {
      const primaryImg = existing.images.find((i) => i.isPrimary) || existing.images[0]
      if (primaryImg) {
        await tx.productImage.update({
          where: { id: primaryImg.id },
          data: { url: input.imageUrl, alt: input.name || existing.name }
        })
      } else {
        await tx.productImage.create({
          data: {
            productId: id,
            url: input.imageUrl,
            alt: input.name || existing.name,
            isPrimary: true,
            sortOrder: 0
          }
        })
      }
    }

    return tx.product.update({
      where: { id },
      data: {
        ...(input.categoryId !== undefined ? { categoryId: input.categoryId } : {}),
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.slug !== undefined ? { slug: input.slug } : {}),
        ...(input.shortDescription !== undefined ? { shortDescription: input.shortDescription } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.price !== undefined ? { price: input.price } : {}),
        ...(input.comparePrice !== undefined ? { comparePrice: input.comparePrice } : {}),
        ...(input.sku !== undefined ? { sku: input.sku } : {}),
        ...(input.stock !== undefined ? { stock: input.stock } : {}),
        ...(input.isAvailable !== undefined ? { isAvailable: input.isAvailable } : {}),
        ...(input.isFeatured !== undefined ? { isFeatured: input.isFeatured } : {}),
        ...(input.isBestSeller !== undefined ? { isBestSeller: input.isBestSeller } : {}),
        ...(input.preparationTime !== undefined ? { preparationTime: input.preparationTime } : {}),
        ...(input.spicyOptions !== undefined ? { spicyOptions: input.spicyOptions } : {}),
        ...(input.extraSambalOptions !== undefined ? { extraSambalOptions: input.extraSambalOptions } : {})
      },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        images: true,
        variants: true
      }
    })
  })

  return {
    data: serializeProduct(updated)
  }
})
