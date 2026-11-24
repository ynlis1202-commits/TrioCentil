<script setup lang="ts">
import { MapPin, Clock, Phone, MessageCircle, ArrowRight } from 'lucide-vue-next'
import { normalizeWhatsappNumber } from '~~/shared/utils/format'

const storefront = useStorefrontStore()
const toast = useToast()
const subscribeEmail = ref('')

const whatsappHref = computed(
  () =>
    `https://wa.me/${normalizeWhatsappNumber(storefront.settings.store_whatsapp)}?text=${encodeURIComponent(
      'Halo Warung Makan TrioCentil, saya ingin memesan atau bertanya mengenai menu.'
    )}`
)

function handleSubscribe() {
  if (!subscribeEmail.value.trim()) return
  toast.add({
    title: 'Terima kasih sudah mendaftar!',
    description: 'Info promo spesial Warung Makan TrioCentil akan segera kami kabarkan.',
    color: 'primary'
  })
  subscribeEmail.value = ''
}
</script>

<template>
  <footer class="bg-[#1F1219] text-pink-50 mt-14 relative overflow-hidden">
    <!-- Subtle soft-pink glow -->
    <div class="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full bg-[#EC4899]/10 blur-3xl" />

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <!-- Top Row (matching reference dark footer top bar) -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pb-10 border-b border-pink-950/80">
        <!-- Newsletter / Info Promo -->
        <div class="lg:col-span-4 space-y-3">
          <h3 class="font-display font-bold text-white text-base">Dapatkan Info Promo!</h3>
          <p class="text-xs text-pink-200/75 leading-relaxed">
            Daftarkan emailmu untuk menerima kode voucher diskon & menu baru dari Warung Makan TrioCentil.
          </p>
          <form class="flex rounded-xl overflow-hidden bg-white p-1 max-w-sm" @submit.prevent="handleSubscribe">
            <input
              v-model="subscribeEmail"
              type="email"
              required
              placeholder="Masukkan email kamu..."
              class="flex-1 px-3 py-2 text-xs text-stone-800 outline-none bg-transparent"
            >
            <button
              type="submit"
              class="px-4 py-2 rounded-lg bg-[#EC4899] hover:bg-[#DB2777] text-white text-xs font-bold transition-colors cursor-pointer"
            >
              Daftar
            </button>
          </form>
        </div>

        <!-- Quick Order & WA -->
        <div class="lg:col-span-3 space-y-3">
          <h3 class="font-display font-bold text-white text-base">Pesan Lebih Cepat</h3>
          <p class="text-xs text-pink-200/75 leading-relaxed">
            Pantau status pesanan real-time atau langsung chat kasir kami via WhatsApp.
          </p>
          <div class="flex flex-wrap gap-2">
            <NuxtLink
              to="/pesanan"
              class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-pink-400/20 text-white text-xs font-semibold transition-colors"
            >
              Lacak Pesanan
              <ArrowRight class="w-3.5 h-3.5 text-[#F472B6]" />
            </NuxtLink>
            <a
              :href="whatsappHref"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#EC4899] hover:bg-[#DB2777] text-white text-xs font-semibold transition-colors"
            >
              <MessageCircle class="w-3.5 h-3.5" />
              WhatsApp
            </a>
          </div>
        </div>

        <!-- Circular Appetizing Food Accent (matches reference footer center dish!) -->
        <div class="hidden lg:flex lg:col-span-2 justify-center">
          <div class="w-28 h-28 rounded-full overflow-hidden border-2 border-[#F472B6]/40 shadow-lg shadow-pink-950/50">
            <img src="/images/sate-nasi.jpg" alt="Sate Ayam TrioCentil" class="w-full h-full object-cover">
          </div>
        </div>

        <!-- Brand Summary -->
        <div class="lg:col-span-3 space-y-3">
          <BrandLogo light />
          <p class="text-xs text-pink-200/75 leading-relaxed">
            Sate ayam bakar arang bumbu kacang legit, nasi hangat, lontong lembut, dan minuman es segar dalam satu tempat.
          </p>
        </div>
      </div>

      <!-- Bottom Columns -->
      <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-12 gap-8 pt-10 items-start">
        <div class="lg:col-span-2">
          <h4 class="text-[11px] font-bold uppercase tracking-wider text-[#F472B6] mb-3.5">TrioCentil</h4>
          <ul class="space-y-2 text-xs text-pink-100/80">
            <li><NuxtLink to="/" class="hover:text-white transition-colors">Beranda</NuxtLink></li>
            <li><NuxtLink to="/tentang" class="hover:text-white transition-colors">Tentang Kami</NuxtLink></li>
            <li><NuxtLink to="/menu" class="hover:text-white transition-colors">Daftar Menu</NuxtLink></li>
            <li><NuxtLink to="/kontak" class="hover:text-white transition-colors">Kontak</NuxtLink></li>
          </ul>
        </div>

        <div class="lg:col-span-2">
          <h4 class="text-[11px] font-bold uppercase tracking-wider text-[#F472B6] mb-3.5">Layanan</h4>
          <ul class="space-y-2 text-xs text-pink-100/80">
            <li><NuxtLink to="/keranjang" class="hover:text-white transition-colors">Keranjang Belanja</NuxtLink></li>
            <li><NuxtLink to="/pesanan" class="hover:text-white transition-colors">Lacak Pesanan</NuxtLink></li>
            <li><NuxtLink to="/menu?category=sate-ayam" class="hover:text-white transition-colors">Sate Ayam</NuxtLink></li>
            <li><NuxtLink to="/menu?category=minuman-es" class="hover:text-white transition-colors">Minuman Es</NuxtLink></li>
          </ul>
        </div>

        <div class="lg:col-span-3">
          <h4 class="text-[11px] font-bold uppercase tracking-wider text-[#F472B6] mb-3.5">Jam Operasional</h4>
          <div class="space-y-2 text-xs text-pink-100/80">
            <p class="flex items-start gap-2">
              <Clock class="w-3.5 h-3.5 text-[#F472B6] shrink-0 mt-0.5" />
              <span>{{ storefront.settings.store_hours_weekday }}</span>
            </p>
            <p class="pl-5.5">{{ storefront.settings.store_hours_weekend }}</p>
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 text-[11px] text-pink-100 mt-1">
              <span class="w-1.5 h-1.5 rounded-full" :class="storefront.settings.store_is_open === 'true' ? 'bg-emerald-400' : 'bg-red-400'" />
              {{ storefront.settings.store_is_open === 'true' ? 'Buka Pemesanan Online' : 'Tutup Sementara' }}
            </span>
          </div>
        </div>

        <div class="lg:col-span-3">
          <h4 class="text-[11px] font-bold uppercase tracking-wider text-[#F472B6] mb-3.5">Hubungi Kami</h4>
          <ul class="space-y-2 text-xs text-pink-100/80">
            <li class="flex items-center gap-2">
              <Phone class="w-3.5 h-3.5 text-[#F472B6] shrink-0" />
              <span>{{ storefront.settings.store_phone }}</span>
            </li>
            <li class="flex items-start gap-2">
              <MapPin class="w-3.5 h-3.5 text-[#F472B6] shrink-0 mt-0.5" />
              <span>{{ storefront.settings.store_address }}</span>
            </li>
          </ul>
        </div>

        <!-- Script Sign-off (matching "Good Food Good Mood ♡" in reference!) -->
        <div class="col-span-2 md:col-span-4 lg:col-span-2 flex lg:justify-end items-end">
          <div class="text-left lg:text-right">
            <p class="font-script text-2xl text-[#F9A8D4] leading-snug">
              Rasa Nikmat,<br>
              Bikin Nagih <span class="text-[#F472B6]">♡</span>
            </p>
          </div>
        </div>
      </div>

      <div class="border-t border-pink-950/80 mt-8 pt-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-pink-200/60">
        <p>© {{ new Date().getFullYear() }} Warung Makan TrioCentil. Hak Cipta Dilindungi.</p>
        <p>Mata Uang: IDR • Zona Waktu: Asia/Jakarta (WIB)</p>
      </div>
    </div>
  </footer>
</template>
