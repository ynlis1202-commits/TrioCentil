import { prisma } from '../../../utils/prisma'
import { requireAdmin } from '../../../utils/auth'
import { categoryUpsertSchema, slugify } from '../../../utils/validation'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const body = await readBody(event)
  const parsed = categoryUpsertSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues[0]?.message || 'Data kategori tidak valid.'
    })
  }

  const slug = parsed.data.slug || slugify(parsed.data.name)
  const existing = await prisma.category.findUnique({ where: { slug } })
  if (existing) {
    throw createError({ statusCode: 409, statusMessage: 'Kategori dengan slug ini sudah ada.' })
  }

  const created = await prisma.category.create({
    data: {
      name: parsed.data.name,
      slug,
      description: parsed.data.description || null,
      icon: parsed.data.icon || null,
      imageUrl: parsed.data.imageUrl || null,
      sortOrder: parsed.data.sortOrder,
      isActive: parsed.data.isActive
    }
  })

  setResponseStatus(event, 201)
  return { data: created }
})
