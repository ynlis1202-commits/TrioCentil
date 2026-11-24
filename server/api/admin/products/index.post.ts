import { prisma } from '../../../utils/prisma'
import { requireAdmin } from '../../../utils/auth'
import { productUpsertSchema, slugify } from '../../../utils/validation'
import { serializeProduct } from '../../../utils/serializers'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const body = await readBody(event)
  const parsed = productUpsertSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues[0]?.message || 'Data produk tidak valid.'
    })
  }

  const input = parsed.data
  const baseSlug = input.slug || slugify(input.name)
  const existingSlug = await prisma.product.findUnique({ where: { slug: baseSlug } })
  const finalSlug = existingSlug ? `${baseSlug}-${Date.now().toString().slice(-4)}` : baseSlug

  const product = await prisma.product.create({
    data: {
      categoryId: input.categoryId,
      name: input.name,
      slug: finalSlug,
      shortDescription: input.shortDescription || null,
      description: input.description,
      price: input.price,
      comparePrice: input.comparePrice || null,
      sku: input.sku || null,
      stock: input.stock,
      isAvailable: input.isAvailable,
      isFeatured: input.isFeatured,
      isBestSeller: input.isBestSeller,
      preparationTime: input.preparationTime,
      spicyOptions: input.spicyOptions,
      extraSambalOptions: input.extraSambalOptions,
      ...(input.imageUrl
        ? {
            images: {
              create: {
                url: input.imageUrl,
                alt: input.name,
                isPrimary: true,
                sortOrder: 0
              }
            }
          }
        : {})
    },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      images: true,
      variants: true
    }
  })

  setResponseStatus(event, 201)
  return {
    data: serializeProduct(product)
  }
})
