import { getStoreSettingsMap } from '../../utils/settings'

export default defineEventHandler(async () => {
  const settings = await getStoreSettingsMap()
  return {
    data: settings
  }
})
