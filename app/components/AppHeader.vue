<script setup lang="ts">
import {
  ShoppingCart,
  Menu as MenuIcon,
  X,
  ShieldCheck,
  User,
  Search,
  Truck,
  Headphones,
  ChevronDown,
  Flame
} from 'lucide-vue-next'
import { formatRupiah } from '~~/shared/utils/format'

const route = useRoute()
const cart = useCartStore()
const auth = useAuthStore()
const storefront = useStorefrontStore()
const mobileMenuOpen = ref(false)
const catDropdownOpen = ref(false)
const searchOpen = ref(false)
const quickSearch = ref('')

const navLinks = [
  { label: 'Beranda', to: '/' },
  { label: 'Menu', to: '/menu' }
]

const categoryQuickLinks = [
  { label: 'Sate Ayam', to: '/menu?category=sate-ayam' },
  { label: 'Nasi dan Lontong', to: '/menu?category=nasi-dan-lontong' },
  { label: 'Makanan Pendamping', to: '/menu?category=makanan-pendamping' },
  { label: 'Minuman Es', to: '/menu?category=minuman-es' }
]

function submitQuickSearch() {
  if (!quickSearch.value.trim()) return
  searchOpen.value = false
  navigateTo(`/menu?search=${encodeURIComponent(quickSearch.value.trim())}`)
  quickSearch.value = ''
}

watch(
  () => route.fullPath,
  () => {
    mobileMenuOpen.value = false
    catDropdownOpen.value = false
  }
)
</script>

<template>
  <div class="sticky top-0 z-40">
    <!-- Top Announcement Bar (matching reference dark slim bar with soft pink icons) -->
    <div class="bg-[#1F1219] text-pink-50 text-[11px] sm:text-xs py-2 border-b border-pink-900/30">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        <div class="flex items-center gap-1.5 text-pink-100/90">
          <Truck class="w-3.5 h-3.5 text-[#F472B6] shrink-0" />
          <span>Gratis Ongkir min. belanja {{ formatRupiah(storefront.settings.free_delivery_min || 75000) }}</span>
        </div>
        <div class="hidden md:flex items-center gap-1.5 font-medium text-white">
          <span>{{ storefront.settings.store_tagline }}</span>
          <Flame class="w-3.5 h-3.5 text-[#F472B6]" />
        </div>
        <NuxtLink to="/kontak" class="hidden sm:flex items-center gap-1.5 text-pink-100/90 hover:text-white transition-colors">
          <Headphones class="w-3.5 h-3.5 text-[#F472B6]" />
          <span>Layanan Ramah & Cepat</span>
        </NuxtLink>
      </div>
    </div>

    <!-- Main Crisp White Header -->
    <header class="bg-white/95 backdrop-blur-md border-b border-pink-100/90 shadow-[0_2px_16px_rgba(236,72,153,0.05)]">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16 sm:h-[72px]">
          <!-- Logo -->
          <NuxtLink to="/" class="focus:outline-none">
            <BrandLogo />
          </NuxtLink>

          <!-- Center Desktop Navigation -->
          <nav class="hidden lg:flex items-center gap-7">
            <NuxtLink
              v-for="item in navLinks"
              :key="item.to"
              :to="item.to"
              class="relative py-1 text-sm font-semibold transition-colors"
              :class="
                route.path === item.to
                  ? 'text-[#EC4899]'
                  : 'text-stone-700 hover:text-[#EC4899]'
              "
            >
              {{ item.label }}
              <span
                v-if="route.path === item.to"
                class="absolute inset-x-0 -bottom-1 h-0.5 rounded-full bg-[#F472B6]"
              />
            </NuxtLink>

            <!-- Categories Dropdown -->
            <div class="relative" @mouseleave="catDropdownOpen = false">
              <button
                type="button"
                class="inline-flex items-center gap-1 py-1 text-sm font-semibold text-stone-700 hover:text-[#EC4899] transition-colors cursor-pointer"
                @click="catDropdownOpen = !catDropdownOpen"
                @mouseenter="catDropdownOpen = true"
              >
                <span>Kategori</span>
                <ChevronDown class="w-4 h-4 text-stone-400" />
              </button>
              <div
                v-if="catDropdownOpen"
                class="absolute left-0 top-full pt-2 w-52 z-50"
              >
                <div class="bg-white rounded-2xl border border-pink-100 shadow-xl py-2 overflow-hidden">
                  <NuxtLink
                    v-for="cat in categoryQuickLinks"
                    :key="cat.to"
                    :to="cat.to"
                    class="block px-4 py-2.5 text-xs font-semibold text-stone-700 hover:bg-[#FFF5F8] hover:text-[#EC4899] transition-colors"
                  >
                    {{ cat.label }}
                  </NuxtLink>
                </div>
              </div>
            </div>

            <NuxtLink
              to="/#promo"
              class="py-1 text-sm font-semibold text-stone-700 hover:text-[#EC4899] transition-colors"
            >
              Promo
            </NuxtLink>

            <NuxtLink
              to="/tentang"
              class="relative py-1 text-sm font-semibold transition-colors"
              :class="route.path === '/tentang' ? 'text-[#EC4899]' : 'text-stone-700 hover:text-[#EC4899]'"
            >
              Tentang Kami
              <span
                v-if="route.path === '/tentang'"
                class="absolute inset-x-0 -bottom-1 h-0.5 rounded-full bg-[#F472B6]"
              />
            </NuxtLink>

            <NuxtLink
              to="/kontak"
              class="relative py-1 text-sm font-semibold transition-colors"
              :class="route.path === '/kontak' ? 'text-[#EC4899]' : 'text-stone-700 hover:text-[#EC4899]'"
            >
              Kontak
              <span
                v-if="route.path === '/kontak'"
                class="absolute inset-x-0 -bottom-1 h-0.5 rounded-full bg-[#F472B6]"
              />
            </NuxtLink>
          </nav>

          <!-- Right Action Icons (Search, User/Admin, Cart) -->
          <div class="flex items-center gap-1.5 sm:gap-2.5">
            <!-- Quick Search Toggle -->
            <button
              type="button"
              aria-label="Cari Menu"
              class="w-10 h-10 rounded-full flex items-center justify-center text-stone-700 hover:bg-[#FFF5F8] hover:text-[#EC4899] transition-colors cursor-pointer"
              @click="searchOpen = !searchOpen"
            >
              <Search class="w-5 h-5" />
            </button>

            <!-- Admin or User Icon -->
            <NuxtLink
              v-if="auth.isAdmin"
              to="/admin"
              class="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold bg-[#9D174D] text-white hover:bg-[#831843] transition-colors"
            >
              <ShieldCheck class="w-3.5 h-3.5" />
              Admin
            </NuxtLink>
            <NuxtLink
              v-else
              :to="auth.isAuthenticated ? '/profil' : '/login'"
              aria-label="Akun Saya"
              class="w-10 h-10 rounded-full flex items-center justify-center text-stone-700 hover:bg-[#FFF5F8] hover:text-[#EC4899] transition-colors"
            >
              <User class="w-5 h-5" />
            </NuxtLink>

            <!-- Cart Icon with Soft Pink Badge -->
            <NuxtLink
              to="/keranjang"
              aria-label="Keranjang Belanja"
              class="relative w-10 h-10 rounded-full flex items-center justify-center text-stone-700 hover:bg-[#FFF5F8] hover:text-[#EC4899] transition-colors"
            >
              <ShoppingCart class="w-5 h-5" />
              <span
                v-if="cart.totalItems > 0"
                class="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#EC4899] text-white text-[10px] font-extrabold flex items-center justify-center shadow-xs"
              >
                {{ cart.totalItems > 99 ? '99+' : cart.totalItems }}
              </span>
            </NuxtLink>

            <!-- Pesan Sekarang CTA (Desktop) -->
            <NuxtLink
              to="/menu"
              class="hidden xl:inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-[#F472B6] to-[#EC4899] hover:from-[#EC4899] hover:to-[#DB2777] text-white text-xs font-bold shadow-sm shadow-pink-500/20 transition-all active:scale-95"
            >
              Pesan Sekarang
            </NuxtLink>

            <!-- Mobile Menu Toggle -->
            <button
              type="button"
              class="lg:hidden w-10 h-10 rounded-full flex items-center justify-center text-stone-700 hover:bg-[#FFF5F8]"
              aria-label="Buka Menu Navigasi"
              @click="mobileMenuOpen = !mobileMenuOpen"
            >
              <X v-if="mobileMenuOpen" class="w-5 h-5" />
              <MenuIcon v-else class="w-5 h-5" />
            </button>
          </div>
        </div>

        <!-- Inline Quick Search Bar -->
        <div v-if="searchOpen" class="pb-3 pt-1">
          <form class="flex gap-2 max-w-xl ml-auto" @submit.prevent="submitQuickSearch">
            <input
              v-model="quickSearch"
              type="search"
              placeholder="Cari sate ayam, nasi hangat, lontong, es jeruk..."
              class="flex-1 px-4 py-2 rounded-full border border-pink-200 bg-[#FFF5F8] focus:bg-white focus:border-[#EC4899] outline-none text-sm"
            >
            <button
              type="submit"
              class="px-5 py-2 rounded-full bg-[#EC4899] text-white text-xs font-bold hover:bg-[#DB2777] cursor-pointer"
            >
              Cari
            </button>
          </form>
        </div>
      </div>

      <!-- Mobile Dropdown Menu -->
      <div v-if="mobileMenuOpen" class="lg:hidden border-t border-pink-100 bg-white px-4 py-4 space-y-1.5 shadow-lg">
        <NuxtLink to="/" class="block px-4 py-2.5 rounded-xl text-sm font-semibold" :class="route.path === '/' ? 'bg-[#FFF5F8] text-[#EC4899]' : 'text-stone-700'">
          Beranda
        </NuxtLink>
        <NuxtLink to="/menu" class="block px-4 py-2.5 rounded-xl text-sm font-semibold" :class="route.path.startsWith('/menu') ? 'bg-[#FFF5F8] text-[#EC4899]' : 'text-stone-700'">
          Menu Lengkap
        </NuxtLink>
        <NuxtLink to="/pesanan" class="block px-4 py-2.5 rounded-xl text-sm font-semibold text-stone-700">
          Lacak Pesanan
        </NuxtLink>
        <NuxtLink to="/tentang" class="block px-4 py-2.5 rounded-xl text-sm font-semibold text-stone-700">
          Tentang Kami
        </NuxtLink>
        <NuxtLink to="/kontak" class="block px-4 py-2.5 rounded-xl text-sm font-semibold text-stone-700">
          Kontak & Lokasi
        </NuxtLink>
        <NuxtLink
          v-if="auth.isAdmin"
          to="/admin"
          class="block px-4 py-2.5 rounded-xl text-sm font-semibold bg-[#9D174D] text-white"
        >
          Dashboard Admin
        </NuxtLink>
        <div class="pt-2">
          <NuxtLink
            to="/menu"
            class="block w-full text-center px-4 py-3 rounded-full bg-gradient-to-r from-[#F472B6] to-[#EC4899] text-white text-sm font-bold"
          >
            Pesan Sekarang
          </NuxtLink>
        </div>
      </div>
    </header>
  </div>
</template>
