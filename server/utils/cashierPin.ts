import crypto from 'node:crypto'
import { prisma } from './prisma'

export const DEFAULT_CASHIER_PIN = '123456'

export async function getCashierPin(): Promise<string> {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: 'cashier_payment_pin' }
    })
    const pin = setting?.value?.trim()
    return pin && pin.length >= 4 ? pin : DEFAULT_CASHIER_PIN
  } catch {
    return DEFAULT_CASHIER_PIN
  }
}

export async function verifyCashierPin(inputPin: string | null | undefined): Promise<boolean> {
  if (!inputPin) return false
  const cleaned = inputPin.trim()
  if (!cleaned) return false

  const expected = await getCashierPin()
  const a = Buffer.from(cleaned, 'utf8')
  const b = Buffer.from(expected, 'utf8')
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}
