import { getStoreSettingsMap } from '../../utils/settings'

export default defineEventHandler(async () => {
  const settings = await getStoreSettingsMap()
  // Never expose cashier_payment_pin to public storefront
  const { cashier_payment_pin: _hidden, ...publicSettings } = settings as Record<string, string>
  return {
    data: publicSettings
  }
})
