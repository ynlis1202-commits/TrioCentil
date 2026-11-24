import { defineStore } from 'pinia'
import type { PublicStoreSettings } from '~~/shared/types'

export const useStorefrontStore = defineStore('storefront', () => {
  const settings = ref<PublicStoreSettings>({
    store_name: 'Warung Makan TrioCentil',
    store_tagline: 'Rasa Nikmat, Harga Bersahabat, Bikin Nagih!',
    store_address: 'Jalan Trans Kalimantan, Bawas, PT Palm Agrosia Lestari Makmur',
    store_phone: '0882-0208-98753 / 0823-5442-2734 / 0823-1342-1226',
    store_whatsapp: '62882020898753',
    store_hours_weekday: 'Senin - Jumat: 07.00 - 22.00 WIB',
    store_hours_weekend: 'Sabtu - Minggu: 08.00 - 21.00 WIB',
    store_is_open: 'true',
    delivery_fee: '10000',
    free_delivery_min: '75000',
    bank_name: 'Bank BCA',
    bank_account_number: '5210-8899-2727',
    bank_account_holder: 'Warung Makan TrioCentil',
    qris_enabled: 'true',
    qris_merchant_name: 'WARUNG MAKAN TRIOCENTIL',
    store_maps_url: 'https://maps.google.com/?q=Jalan+Trans+Kalimantan+Bawas+PT+Palm+Agrosia+Lestari+Makmur'
  })
  const loaded = ref(false)

  async function fetchSettings() {
    if (loaded.value) return settings.value
    try {
      const res = await $fetch<{ data: PublicStoreSettings }>('/api/settings/public')
      if (res.data) {
        settings.value = { ...settings.value, ...res.data }
      }
      loaded.value = true
    } catch {
      // Keep safe defaults
    }
    return settings.value
  }

  return {
    settings,
    loaded,
    fetchSettings
  }
})
