import { UserRole } from '@prisma/client'
import { prisma } from '../../utils/prisma'
import { registerSchema } from '../../utils/validation'
import { hashPassword, setAuthCookie } from '../../utils/auth'
import { checkRateLimit } from '../../utils/rateLimit'
import { normalizeWhatsappNumber } from '../../../shared/utils/format'

export default defineEventHandler(async (event) => {
  checkRateLimit(event, { keyPrefix: 'auth-register', maxRequests: 8, windowMs: 15 * 60 * 1000 })

  const body = await readBody(event)
  const parsed = registerSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues[0]?.message || 'Data pendaftaran tidak valid.'
    })
  }

  const email = parsed.data.email.toLowerCase()
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Email ini sudah terdaftar. Silakan masuk dengan akun Anda.'
    })
  }

  const passwordHash = await hashPassword(parsed.data.password)
  const normalizedPhone = normalizeWhatsappNumber(parsed.data.phone)

  const user = await prisma.$transaction(async (tx) => {
    const createdUser = await tx.user.create({
      data: {
        name: parsed.data.name,
        email,
        phone: normalizedPhone,
        passwordHash,
        role: UserRole.CUSTOMER
      }
    })

    await tx.customer.upsert({
      where: { whatsapp: normalizedPhone },
      update: {
        userId: createdUser.id,
        name: parsed.data.name,
        email
      },
      create: {
        userId: createdUser.id,
        name: parsed.data.name,
        whatsapp: normalizedPhone,
        email
      }
    })

    return createdUser
  })

  setAuthCookie(event, user.id, user.role)
  setResponseStatus(event, 201)

  return {
    data: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role
    }
  }
})
