<script setup lang="ts">
import { MapPin, Phone, Clock, MessageCircle, ExternalLink } from 'lucide-vue-next'
import { normalizeWhatsappNumber } from '~~/shared/utils/format'

useHead({ title: 'Kontak & Lokasi' })

const storefront = useStorefrontStore()
const whatsappHref = computed(
  () =>
    `https://wa.me/${normalizeWhatsappNumber(storefront.settings.store_whatsapp)}?text=${encodeURIComponent(
      'Halo Warung Makan TrioCentil, saya ingin menanyakan informasi pesanan / catering.'
    )}`
)
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
    <div class="text-center space-y-2">
      <span class="text-xs font-bold uppercase tracking-wider text-[#EC4899]">Hubungi Kami</span>
      <h1 class="font-display font-extrabold text-3xl sm:text-4xl text-[#292524]">
        Kontak & Lokasi Warung
      </h1>
      <p class="text-sm text-stone-600 max-w-xl mx-auto">
        Butuh bantuan pesanan, reservasi rombongan, atau pesan paket nasi kotak sate ayam? Hubungi kami kapan saja di jam operasional.
      </p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
      <div class="bg-white rounded-2xl border border-pink-100 p-6 shadow-xs space-y-3">
        <div class="w-11 h-11 rounded-xl bg-[#FFF5F8] text-[#E11D48] flex items-center justify-center">
          <MapPin class="w-5 h-5" />
        </div>
        <h2 class="font-display font-bold text-base text-[#9D174D]">Alamat Warung</h2>
        <p class="text-sm text-stone-600 leading-relaxed">{{ storefront.settings.store_address }}</p>
        <a
          :href="storefront.settings.store_maps_url"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-1.5 text-xs font-bold text-[#EC4899] hover:underline"
        >
          <span>Petunjuk Arah Google Maps</span>
          <ExternalLink class="w-3.5 h-3.5" />
        </a>
      </div>

      <div class="bg-white rounded-2xl border border-pink-100 p-6 shadow-xs space-y-3">
        <div class="w-11 h-11 rounded-xl bg-[#FFF5F8] text-[#EC4899] flex items-center justify-center">
          <Clock class="w-5 h-5" />
        </div>
        <h2 class="font-display font-bold text-base text-[#9D174D]">Jam Operasional</h2>
        <p class="text-sm text-stone-600">{{ storefront.settings.store_hours_weekday }}</p>
        <p class="text-sm text-stone-600">{{ storefront.settings.store_hours_weekend }}</p>
      </div>

      <div class="bg-white rounded-2xl border border-pink-100 p-6 shadow-xs space-y-3">
        <div class="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
          <Phone class="w-5 h-5" />
        </div>
        <h2 class="font-display font-bold text-base text-[#9D174D]">Nomor yang Bisa Dihubungi</h2>
        <ul class="space-y-1.5 text-sm text-stone-700 font-medium">
          <li v-for="num in storefront.settings.store_phone.split('/').map((n) => n.trim()).filter(Boolean)" :key="num">
            <a
              :href="`https://wa.me/${normalizeWhatsappNumber(num)}`"
              target="_blank"
              rel="noopener noreferrer"
              class="hover:text-[#EC4899] transition-colors"
            >
              {{ num }}
            </a>
          </li>
        </ul>
        <a
          :href="whatsappHref"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors"
        >
          <MessageCircle class="w-4 h-4" />
          <span>Chat WhatsApp Sekarang</span>
        </a>
      </div>
    </div>
  </div>
</template>
