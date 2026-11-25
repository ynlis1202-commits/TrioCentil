import { requireAdmin } from '../../../utils/auth'
import { getStoreSettingsMap } from '../../../utils/settings'
import { getCashierPin } from '../../../utils/cashierPin'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const [settings, cashierPin] = await Promise.all([getStoreSettingsMap(), getCashierPin()])
  return {
    data: {
      ...settings,
      cashier_payment_pin: cashierPin
    }
  }
})
