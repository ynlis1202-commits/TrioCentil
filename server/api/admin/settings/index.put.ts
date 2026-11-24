import { z } from 'zod'
import { prisma } from '../../../utils/prisma'
import { requireAdmin } from '../../../utils/auth'

const settingsSchema = z.record(z.string().min(1).max(100), z.string().max(1000))

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const body = await readBody(event)
  const parsed = settingsSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Format pengaturan tidak valid.' })
  }

  await prisma.$transaction(
    Object.entries(parsed.data).map(([key, value]) =>
      prisma.setting.upsert({
        where: { key },
        update: { value },
        create: { key, value, group: 'general' }
      })
    )
  )

  return { success: true }
})
