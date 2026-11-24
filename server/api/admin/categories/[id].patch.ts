import { prisma } from '../../../utils/prisma'
import { requireAdmin } from '../../../utils/auth'
import { categoryUpsertSchema } from '../../../utils/validation'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'ID kategori tidak valid.' })

  const body = await readBody(event)
  const parsed = categoryUpsertSchema.partial().safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues[0]?.message || 'Data kategori tidak valid.'
    })
  }

  const updated = await prisma.category.update({
    where: { id },
    data: parsed.data
  })

  return { data: updated }
})
