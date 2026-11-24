<script setup lang="ts">
import {
  ArrowRight,
  Flame,
  Star,
  Clock,
  MapPin,
  ShieldCheck,
  Wallet,
  Headphones,
  Gift,
  Truck,
  Utensils,
  Soup,
  CupSoda,
  ShoppingBag,
  Smile,
  Search,
  Copy,
  Check,
  MessageCircle
} from 'lucide-vue-next'
import type { CategoryDTO, ProductDTO, PromotionDTO } from '~~/shared/types'
import { formatRupiah, normalizeWhatsappNumber } from '~~/shared/utils/format'

useHead({ title: 'Beranda' })

const storefront = useStorefrontStore()
const toast = useToast()
const copiedCode = ref<string | null>(null)

const {
  data: categoriesRes,
  pending: loadingCats,
  error: catsError,
  refresh: refreshCats
} = await useFetch<{ data: CategoryDTO[] }>('/api/categories')

const {
  data: bestSellerRes,
  pending: loadingBest,
  error: bestError,
  refresh: refreshBest
} = await useFetch<{ data: ProductDTO[] }>('/api/products', {
  query: { bestSeller: 'true' }
})

const { data: promosRes } = await useFetch<{ data: PromotionDTO[] }>('/api/promotions')

const categories = computed(() => categoriesRes.value?.data || [])
const bestSellers = computed(() => bestSellerRes.value?.data || [])
const promos = computed(() => promosRes.value?.data || [])
const featuredPromo = computed(() => promos.value[0] || null)

function getCategoryIcon(slug: string) {
  if (slug.includes('sate')) return Flame
  if (slug.includes('nasi') || slug.includes('lontong')) return Utensils
  if (slug.includes('minuman')) return CupSoda
  return Soup
}

async function copyPromoCode(code: string) {
  if (import.meta.client && navigator.clipboard) {
    await navigator.clipboard.writeText(code)
    copiedCode.value = code
    toast.add({
      title: 'Kode Promo Disalin!',
      description: `Gunakan kode ${code} di keranjang belanja untuk mendapatkan diskon.`,
      color: 'primary'
    })
    setTimeout(() => {
      copiedCode.value = null
    }, 2500)
  }
}

const featureHighlights = [
  { icon: Truck, title: 'Pengiriman Cepat', desc: 'Pesanan tiba hangat ±30 mnt' },
  { icon: ShieldCheck, title: 'Kualitas Terbaik', desc: 'Ayam segar & bumbu asli' },
  { icon: Wallet, title: 'Harga Bersahabat', desc: 'Nikmat & ramah di kantong' },
  { icon: Headphones, title: 'Layanan Ramah', desc: 'Siap layani setiap hari' },
  { icon: Gift, title: 'Promo Spesial', desc: 'Diskon & voucher menarik' }
]

const howItWorks = [
  {
    icon: Search,
    title: 'Pilih Menu Favorit',
    desc: 'Jelajahi sate ayam, nasi, lontong & es segar lalu atur tingkat pedasmu.'
  },
  {
    icon: ShoppingBag,
    title: 'Buat Pesanan',
    desc: 'Masukkan ke keranjang, pilih metode ambil & pembayaran dengan mudah.'
  },
  {
    icon: Truck,
    title: 'Bakar & Antar Cepat',
    desc: 'Sate dibakar hangat dadakan dan segera diantar atau siap diambil.'
  },
  {
    icon: Smile,
    title: 'Nikmati Hidangan',
    desc: 'Santap kelezatan sate ayam bumbu kacang khas TrioCentil!'
  }
]

const testimonials = [
  {
    name: 'Rina Kusuma',
    role: 'Pelanggan Tetap • Kemang',
    initials: 'RK',
    quote: 'Sate ayamnya empuk banget, bumbu kacangnya kental dan nggak pelit! Apalagi dipadu sama lontong daun pisang dan es jeruk perasnya, juara!'
  },
  {
    name: 'Dimas Pratama',
    role: 'Karyawan Swasta',
    initials: 'DP',
    quote: 'Pesan online lewat websitenya super gampang, bisa pilih level pedas dan ekstra sambal kacang. Sampai kantor satenya masih hangat.'
  },
  {
    name: 'Ibu Lestari',
    role: 'Pesan Acara Keluarga',
    initials: 'IL',
    quote: 'Kemarin pesan 20 porsi Sate Ayam + Nasi pakai kode promo. Pelayanan ramah, tepat waktu, semua tamu bilang enak dan bikin nagih!'
  }
]

const whatsappLink = computed(
  () => `https://wa.me/${normalizeWhatsappNumber(storefront.settings.store_whatsapp)}`
)
</script>

<template>
  <div>
    <!-- ==========================================
         HERO SECTION (BiteHub Layout + Soft Pink)
         ========================================== -->
    <section class="relative overflow-hidden bg-gradient-to-br from-[#FFF5F8] via-[#FCE7F3]/75 to-[#FDF2F8] pt-8 pb-20 sm:pt-12 sm:pb-24 lg:pt-14 lg:pb-28">
      <!-- Soft pink decorative ambient blobs -->
      <div class="pointer-events-none absolute -top-24 left-1/3 w-96 h-96 rounded-full bg-[#FBCFE8]/45 blur-3xl" />
      <div class="pointer-events-none absolute bottom-0 right-10 w-80 h-80 rounded-full bg-[#F9A8D4]/30 blur-3xl" />

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          <!-- Left Editorial Typography -->
          <div class="lg:col-span-6 space-y-5">
            <p class="font-script text-2xl sm:text-3xl text-[#9D174D]">
              Sate Ayam Lezat,
            </p>

            <h1 class="font-display font-extrabold text-4xl sm:text-5xl lg:text-[56px] text-[#1F1219] leading-[1.08] tracking-tight">
              Nikmati Sate
              <span class="block text-[#EC4899] mt-1 inline-flex items-center gap-2.5 flex-wrap">
                <span>Favoritmu</span>
                <!-- Cute dashed hand-drawn heart SVG like reference -->
                <svg class="w-9 h-9 sm:w-11 sm:h-11 text-[#F472B6] inline-block" viewBox="0 0 48 48" fill="none" aria-hidden="true">
                  <path
                    d="M24 41C24 41 7 30.2 7 17.5C7 11.7 11.5 7.5 16.8 7.5C20.2 7.5 22.8 9.4 24 11.8C25.2 9.4 27.8 7.5 31.2 7.5C36.5 7.5 41 11.7 41 17.5C41 30.2 24 41 24 41Z"
                    stroke="currentColor"
                    stroke-width="2.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-dasharray="4 4"
                  />
                </svg>
              </span>
            </h1>

            <p class="text-sm sm:text-base text-stone-600 leading-relaxed max-w-md">
              Sate ayam lezat, nasi hangat, lontong lembut, dan minuman es segar dalam satu tempat — diantar cepat & hangat ke pintumu.
            </p>

            <!-- Pill CTA Buttons -->
            <div class="flex flex-wrap items-center gap-3 pt-1">
              <NuxtLink
                to="/menu"
                class="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-gradient-to-r from-[#F472B6] to-[#EC4899] hover:from-[#EC4899] hover:to-[#DB2777] text-white font-bold text-sm shadow-lg shadow-pink-500/25 transition-all active:scale-95"
              >
                <span>Pesan Sekarang</span>
                <ArrowRight class="w-4 h-4" />
              </NuxtLink>
              <a
                href="#menu-populer"
                class="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-white hover:bg-[#FFF5F8] text-[#1F1219] border border-pink-200 font-bold text-sm shadow-2xs transition-colors"
              >
                Lihat Menu
              </a>
            </div>

            <!-- Happy Customers Avatar Stack (matching reference!) -->
            <div class="flex items-center gap-3.5 pt-2">
              <div class="flex -space-x-2.5">
                <div class="w-9 h-9 rounded-full bg-[#FBCFE8] border-2 border-white flex items-center justify-center text-[11px] font-extrabold text-[#9D174D]">
                  RK
                </div>
                <div class="w-9 h-9 rounded-full bg-[#F9A8D4] border-2 border-white flex items-center justify-center text-[11px] font-extrabold text-[#831843]">
                  DP
                </div>
                <div class="w-9 h-9 rounded-full bg-[#F472B6] border-2 border-white flex items-center justify-center text-[11px] font-extrabold text-white">
                  IL
                </div>
                <div class="w-9 h-9 rounded-full bg-[#EC4899] border-2 border-white flex items-center justify-center text-[11px] font-extrabold text-white">
                  BS
                </div>
              </div>
              <div>
                <p class="text-xs font-extrabold text-[#1F1219]">1.000+ Pelanggan Puas</p>
                <div class="flex items-center gap-0.5 mt-0.5">
                  <Star v-for="n in 5" :key="n" class="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span class="text-[11px] font-bold text-stone-500 ml-1">4.9</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Right Food Platter Composition -->
          <div class="lg:col-span-6 relative">
            <div class="relative mx-auto max-w-lg lg:max-w-none">
              <div class="relative rounded-[2.25rem] overflow-hidden shadow-2xl shadow-pink-900/15 border-[6px] border-white bg-white">
                <img
                  src="/images/hero-sate.jpg"
                  alt="Sate Ayam Bakar Warung Makan TrioCentil"
                  class="w-full aspect-[16/11] object-cover"
                >
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ==========================================
         FLOATING 5-FEATURE BAR (overlapping hero!)
         ========================================== -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-20">
      <div class="bg-white rounded-2xl shadow-xl shadow-pink-900/5 border border-pink-100/90 p-5 sm:p-6">
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
          <div
            v-for="feat in featureHighlights"
            :key="feat.title"
            class="flex items-center gap-3"
          >
            <div class="w-11 h-11 rounded-full bg-[#FFF5F8] border border-pink-100 text-[#EC4899] flex items-center justify-center shrink-0">
              <component :is="feat.icon" class="w-5 h-5" />
            </div>
            <div class="min-w-0">
              <p class="font-display font-bold text-xs sm:text-sm text-[#1F1219] truncate">
                {{ feat.title }}
              </p>
              <p class="text-[11px] text-stone-500 leading-snug line-clamp-2">
                {{ feat.desc }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ==========================================
         EXPLORE CATEGORIES (Jelajahi Kategori)
         ========================================== -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-14">
      <div class="flex items-center justify-between gap-4 mb-6">
        <h2 class="font-display font-extrabold text-xl sm:text-2xl text-[#1F1219]">
          Jelajahi Kategori
        </h2>
        <NuxtLink
          to="/menu"
          class="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-stone-600 hover:text-[#EC4899] transition-colors"
        >
          <span>Lihat semua kategori</span>
          <ArrowRight class="w-4 h-4" />
        </NuxtLink>
      </div>

      <div v-if="loadingCats" class="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <div v-for="i in 4" :key="i" class="h-48 rounded-2xl bg-pink-100/50 animate-pulse" />
      </div>

      <div v-else-if="catsError" class="p-6 rounded-2xl bg-[#FFF5F8] border border-pink-200 text-center">
        <p class="text-sm text-[#9D174D] font-semibold">
          Kategori belum termuat. Pastikan database TiDB Cloud sudah terhubung di .env & sudah menjalankan `npm run db:push` serta `npm run db:seed`.
        </p>
        <button
          type="button"
          class="mt-3 px-4 py-2 rounded-full bg-[#EC4899] text-white text-xs font-bold cursor-pointer"
          @click="refreshCats()"
        >
          Coba Lagi
        </button>
      </div>

      <div v-else class="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <NuxtLink
          v-for="cat in categories"
          :key="cat.id"
          :to="`/menu?category=${cat.slug}`"
          class="group bg-white rounded-2xl border border-pink-100/90 shadow-xs hover:shadow-lg hover:shadow-pink-500/10 hover:border-pink-200 transition-all overflow-hidden"
        >
          <div class="relative aspect-[16/11] overflow-hidden bg-[#FFF5F8]">
            <img
              :src="cat.imageUrl || '/images/sate-original.jpg'"
              :alt="cat.name"
              loading="lazy"
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            >
          </div>
          <div class="relative px-4 pb-4 pt-6">
            <!-- Floating circular icon overlapping image (signature reference detail!) -->
            <div class="absolute -top-5 left-4 w-10 h-10 rounded-full bg-white shadow-md border border-pink-100 flex items-center justify-center text-[#EC4899]">
              <component :is="getCategoryIcon(cat.slug)" class="w-4 h-4" />
            </div>
            <h3 class="font-display font-bold text-[#1F1219] group-hover:text-[#EC4899] transition-colors text-sm sm:text-base">
              {{ cat.name }}
            </h3>
            <p class="text-xs text-stone-400 font-medium mt-0.5">
              {{ cat.productCount ?? 0 }}+ Menu
            </p>
          </div>
        </NuxtLink>
      </div>
    </section>

    <!-- ==========================================
         POPULAR DISHES (Menu Best Seller)
         ========================================== -->
    <section id="menu-populer" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 sm:pb-16">
      <div class="flex items-center justify-between gap-4 mb-6">
        <h2 class="font-display font-extrabold text-xl sm:text-2xl text-[#1F1219]">
          Menu Terpopuler
        </h2>
        <NuxtLink
          to="/menu"
          class="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-stone-600 hover:text-[#EC4899] transition-colors"
        >
          <span>Lihat semua menu</span>
          <ArrowRight class="w-4 h-4" />
        </NuxtLink>
      </div>

      <div v-if="loadingBest" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
        <div v-for="i in 5" :key="i" class="h-72 rounded-2xl bg-pink-100/40 animate-pulse" />
      </div>

      <div v-else-if="bestError" class="p-8 rounded-2xl bg-[#FFF5F8] border border-pink-200 text-center">
        <p class="text-sm text-[#9D174D] font-semibold">
          Daftar menu terpopuler belum dapat dimuat dari database.
        </p>
        <button
          type="button"
          class="mt-3 px-4 py-2 rounded-full bg-[#EC4899] text-white text-xs font-bold cursor-pointer"
          @click="refreshBest()"
        >
          Muat Ulang
        </button>
      </div>

      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
        <ProductCard v-for="product in bestSellers" :key="product.id" :product="product" />
      </div>
    </section>

    <!-- ==========================================
         DARK ROUNDED PROMO BANNER (exact reference match!)
         ========================================== -->
    <section id="promo" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 sm:pb-16">
      <div class="relative overflow-hidden rounded-3xl bg-[#1F1219] text-white px-6 py-8 sm:px-10 sm:py-9 shadow-xl shadow-pink-950/15">
        <!-- Soft pink subtle radial highlights -->
        <div class="pointer-events-none absolute -left-16 -bottom-16 w-56 h-56 rounded-full bg-[#EC4899]/20 blur-3xl" />
        <div class="pointer-events-none absolute right-20 -top-16 w-56 h-56 rounded-full bg-[#F472B6]/15 blur-3xl" />

        <div class="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <!-- Left Takeaway Bag Icon Graphic -->
          <div class="hidden lg:flex lg:col-span-2 justify-center">
            <div class="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#F472B6] to-[#EC4899] p-4 shadow-lg shadow-pink-500/30 flex flex-col items-center justify-center text-white -rotate-3">
              <ShoppingBag class="w-9 h-9 mb-1" />
              <span class="font-display font-extrabold text-[10px] tracking-wider uppercase">TrioCentil</span>
            </div>
          </div>

          <!-- Center Promo Headline -->
          <div class="lg:col-span-4 space-y-1.5">
            <p class="text-[11px] font-bold uppercase tracking-[0.16em] text-[#F9A8D4]">
              LAPAR? KAMI SIAP ANTAR!
            </p>
            <h2 class="font-display font-extrabold text-2xl sm:text-3xl leading-tight">
              {{ featuredPromo ? featuredPromo.title : 'Diskon 10% Pecinta Sate' }}
            </h2>
            <p class="text-xs text-pink-100/75">
              {{ featuredPromo ? featuredPromo.description : 'Nikmati potongan spesial untuk pemesanan online hari ini.' }}
            </p>
          </div>

          <!-- Promo Code Dashed Pill Box (matching reference!) -->
          <div class="lg:col-span-4 flex flex-col items-start lg:items-center gap-2">
            <button
              type="button"
              class="group px-6 py-3 rounded-2xl border-2 border-dashed border-[#F472B6]/70 bg-white/5 hover:bg-white/10 transition-colors cursor-pointer flex items-center gap-2.5"
              @click="copyPromoCode(featuredPromo?.code || 'HEMAT10')"
            >
              <span class="text-xs text-pink-100">Pakai Kode:</span>
              <span class="font-mono font-extrabold text-base tracking-widest text-[#F9A8D4]">
                {{ featuredPromo?.code || 'HEMAT10' }}
              </span>
              <Check v-if="copiedCode === (featuredPromo?.code || 'HEMAT10')" class="w-4 h-4 text-emerald-400" />
              <Copy v-else class="w-4 h-4 text-[#F472B6] group-hover:scale-110 transition-transform" />
            </button>
            <p class="text-[11px] text-pink-200/70">
              Min. belanja {{ formatRupiah(featuredPromo?.minOrderAmount || 40000) }} • Klik kode untuk menyalin
            </p>
          </div>

          <!-- Right Circular Food Bowl -->
          <div class="hidden lg:flex lg:col-span-2 justify-end">
            <div class="w-28 h-28 rounded-full overflow-hidden border-4 border-[#F472B6]/35 shadow-2xl">
              <img src="/images/sate-lontong.jpg" alt="Promo Sate Ayam TrioCentil" class="w-full h-full object-cover">
            </div>
          </div>
        </div>
      </div>

      <!-- Additional Promo Vouchers (if > 1 in DB) -->
      <div v-if="promos.length > 1" class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div
          v-for="promo in promos.slice(1)"
          :key="promo.id"
          class="bg-white rounded-2xl border border-pink-100 p-4 flex items-center justify-between gap-4 shadow-2xs"
        >
          <div>
            <span class="px-2.5 py-0.5 rounded-full bg-[#FCE7F3] text-[#9D174D] text-[10px] font-extrabold uppercase">
              {{ promo.badgeText || 'VOUCHER' }}
            </span>
            <p class="font-display font-bold text-sm text-[#1F1219] mt-1">{{ promo.title }}</p>
            <p class="text-xs text-stone-500">Min. belanja {{ formatRupiah(promo.minOrderAmount) }}</p>
          </div>
          <button
            type="button"
            class="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FFF5F8] hover:bg-[#FCE7F3] border border-pink-200 text-[#9D174D] font-mono font-bold text-xs cursor-pointer"
            @click="copyPromoCode(promo.code)"
          >
            <span>{{ promo.code }}</span>
            <Check v-if="copiedCode === promo.code" class="w-3.5 h-3.5 text-emerald-600" />
            <Copy v-else class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </section>

    <!-- ==========================================
         HOW IT WORKS (Cara Pemesanan — matching reference 4 steps!)
         ========================================== -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div class="text-center mb-10">
        <h2 class="font-display font-extrabold text-2xl sm:text-3xl text-[#1F1219]">
          Cara Pemesanan
        </h2>
        <p class="text-xs sm:text-sm text-stone-500 mt-1">
          Hanya 4 langkah mudah untuk menikmati sate ayam hangat favoritmu
        </p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div
          v-for="(item, idx) in howItWorks"
          :key="item.title"
          class="relative flex items-start gap-3.5 p-5 rounded-2xl bg-white border border-pink-100/80 shadow-2xs"
        >
          <div class="w-12 h-12 rounded-full bg-[#FFF5F8] border border-pink-200/80 text-[#EC4899] flex items-center justify-center shrink-0">
            <component :is="item.icon" class="w-5 h-5" />
          </div>
          <div>
            <h3 class="font-display font-bold text-sm text-[#1F1219]">{{ item.title }}</h3>
            <p class="text-xs text-stone-500 mt-1 leading-relaxed">{{ item.desc }}</p>
          </div>

          <!-- Connector Arrow on Desktop -->
          <ArrowRight
            v-if="idx < howItWorks.length - 1"
            class="hidden lg:block w-5 h-5 text-[#F9A8D4] absolute -right-5 top-1/2 -translate-y-1/2 z-10"
          />
        </div>
      </div>
    </section>

    <!-- ==========================================
         TESTIMONI PELANGGAN & LOKASI WARUNG
         ========================================== -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      <!-- Testimonials -->
      <div class="rounded-3xl bg-[#FFF5F8] border border-pink-100 p-6 sm:p-10">
        <div class="text-center max-w-xl mx-auto mb-8">
          <span class="text-xs font-bold uppercase tracking-wider text-[#EC4899]">Kata Pelanggan</span>
          <h2 class="font-display font-extrabold text-2xl sm:text-3xl text-[#1F1219] mt-1">
            Cerita Pecinta TrioCentil
          </h2>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div
            v-for="t in testimonials"
            :key="t.name"
            class="bg-white rounded-2xl border border-pink-100 p-5 shadow-2xs flex flex-col justify-between"
          >
            <div>
              <div class="flex items-center gap-0.5 text-amber-400 mb-3">
                <Star v-for="n in 5" :key="n" class="w-4 h-4 fill-amber-400" />
              </div>
              <p class="text-xs sm:text-sm text-stone-600 leading-relaxed italic">
                "{{ t.quote }}"
              </p>
            </div>
            <div class="flex items-center gap-3 mt-5 pt-4 border-t border-pink-50">
              <div class="w-9 h-9 rounded-full bg-[#FCE7F3] text-[#9D174D] font-bold text-xs flex items-center justify-center">
                {{ t.initials }}
              </div>
              <div>
                <p class="font-display font-bold text-xs text-[#1F1219]">{{ t.name }}</p>
                <p class="text-[11px] text-stone-400">{{ t.role }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Jam Operasional & Lokasi Card -->
      <div class="rounded-3xl bg-white border border-pink-100 shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        <div class="lg:col-span-7 p-6 sm:p-10 space-y-5">
          <div>
            <span class="text-xs font-bold uppercase tracking-wider text-[#EC4899]">Kunjungi Warung Kami</span>
            <h2 class="font-display font-extrabold text-2xl sm:text-3xl text-[#1F1219] mt-1">
              Jam Operasional & Lokasi
            </h2>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="p-4 rounded-2xl bg-[#FFF5F8] border border-pink-100 space-y-1.5 text-xs sm:text-sm">
              <div class="flex items-center gap-2 font-bold text-[#9D174D]">
                <Clock class="w-4 h-4 text-[#EC4899]" />
                Jam Buka
              </div>
              <p class="text-stone-700">{{ storefront.settings.store_hours_weekday }}</p>
              <p class="text-stone-700">{{ storefront.settings.store_hours_weekend }}</p>
            </div>

            <div class="p-4 rounded-2xl bg-[#FFF5F8] border border-pink-100 space-y-1.5 text-xs sm:text-sm">
              <div class="flex items-center gap-2 font-bold text-[#9D174D]">
                <MapPin class="w-4 h-4 text-[#EC4899]" />
                Alamat Warung
              </div>
              <p class="text-stone-700">{{ storefront.settings.store_address }}</p>
            </div>
          </div>

          <div class="flex flex-wrap gap-3 pt-1">
            <a
              :href="storefront.settings.store_maps_url"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#1F1219] hover:bg-[#3a202e] text-white text-xs sm:text-sm font-bold transition-colors"
            >
              <MapPin class="w-4 h-4 text-[#F472B6]" />
              Buka Google Maps
            </a>
            <a
              :href="whatsappLink"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#F472B6] to-[#EC4899] hover:from-[#EC4899] hover:to-[#DB2777] text-white text-xs sm:text-sm font-bold transition-colors"
            >
              <MessageCircle class="w-4 h-4" />
              Chat WhatsApp
            </a>
          </div>
        </div>

        <div class="lg:col-span-5 relative min-h-56">
          <img
            src="/images/sate-original.jpg"
            alt="Sate Ayam Warung Makan TrioCentil"
            class="w-full h-full object-cover"
          >
        </div>
      </div>
    </section>
  </div>
</template>
