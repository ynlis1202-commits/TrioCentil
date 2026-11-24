import { prisma } from './prisma'
import type { PublicStoreSettings } from '../../shared/types'

export async function getStoreSettingsMap(): Promise<PublicStoreSettings> {
  const config = useRuntimeConfig()
  const defaults: PublicStoreSettings = {
    store_name: 'Warung Makan TrioCentil',
    store_tagline: 'Rasa Nikmat, Harga Bersahabat, Bikin Nagih!',
    store_address: 'Jalan Trans Kalimantan, Bawas, PT Palm Agrosia Lestari Makmur',
    store_phone: '0882-0208-98753 / 0823-5442-2734 / 0823-1342-1226',
    store_whatsapp: config.storeWhatsappNumber || '62882020898753',
    store_hours_weekday: 'Senin - Jumat: 07.00 - 22.00 WIB',
    store_hours_weekend: 'Sabtu - Minggu: 08.00 - 21.00 WIB',
    store_is_open: 'true',
    delivery_fee: '10000',
    free_delivery_min: '75000',
    bank_name: 'Bank BCA',
    bank_account_number: '5210-8899-2727',
    bank_account_holder: 'Warung Makan TrioCentil',
    qris_enabled: config.qrisEnabled ? 'true' : 'false',
    qris_merchant_name: config.qrisMerchantName || 'WARUNG MAKAN TRIOCENTIL',
    store_maps_url: 'https://maps.google.com/?q=Jalan+Trans+Kalimantan+Bawas+PT+Palm+Agrosia+Lestari+Makmur'
  }

  const rows = await prisma.setting.findMany()
  const map = { ...defaults } as Record<string, string>
  for (const row of rows) {
    map[row.key] = row.value
  }

  // Always prefer configured environment variable for official store WhatsApp if present
  if (config.storeWhatsappNumber) {
    map.store_whatsapp = config.storeWhatsappNumber
  }

  return map as unknown as PublicStoreSettings
}
