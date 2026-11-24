import { requireAdmin } from '../../../utils/auth'
import { getStoreSettingsMap } from '../../../utils/settings'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const settings = await getStoreSettingsMap()
  return { data: settings }
})
