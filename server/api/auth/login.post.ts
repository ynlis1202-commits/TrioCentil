import { prisma } from '../../utils/prisma'
import { loginSchema } from '../../utils/validation'
import { verifyPassword, setAuthCookie } from '../../utils/auth'
import { checkRateLimit } from '../../utils/rateLimit'

export default defineEventHandler(async (event) => {
  checkRateLimit(event, { keyPrefix: 'auth-login', maxRequests: 10, windowMs: 15 * 60 * 1000 })

  const body = await readBody(event)
  const parsed = loginSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues[0]?.message || 'Email atau kata sandi tidak valid.'
    })
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() }
  })

  if (!user || !user.isActive) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Email atau kata sandi salah.'
    })
  }

  const valid = await verifyPassword(parsed.data.password, user.passwordHash)
  if (!valid) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Email atau kata sandi salah.'
    })
  }

  setAuthCookie(event, user.id, user.role)

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
