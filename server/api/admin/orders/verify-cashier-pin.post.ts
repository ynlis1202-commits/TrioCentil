import { z } from 'zod'
import { requireAdmin } from '../../../utils/auth'
import { checkRateLimit } from '../../../utils/rateLimit'
import { verifyCashierPin } from '../../../utils/cashierPin'

const pinSchema = z.object({
  pin: z.string().trim().min(4, 'PIN minimal 4 digit').max(8, 'PIN maksimal 8 digit')
})

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  checkRateLimit(event, { keyPrefix: 'cashier-pin', maxRequests: 12, windowMs: 5 * 60 * 1000 })

  const body = await readBody(event)
  const parsed = pinSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues[0]?.message || 'Format PIN tidak valid.'
    })
  }

  const valid = await verifyCashierPin(parsed.data.pin)
  if (!valid) {
    throw createError({
      statusCode: 403,
      statusMessage: 'PIN Kasir salah. Silakan coba lagi.'
    })
  }

  return { valid: true }
})
