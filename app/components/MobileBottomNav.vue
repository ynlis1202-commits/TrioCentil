<script setup lang="ts">
import { Home, UtensilsCrossed, ShoppingBag, ClipboardList, User } from 'lucide-vue-next'

const route = useRoute()
const cart = useCartStore()

const tabs = [
  { label: 'Beranda', to: '/', icon: Home, match: (p: string) => p === '/' },
  { label: 'Menu', to: '/menu', icon: UtensilsCrossed, match: (p: string) => p.startsWith('/menu') },
  { label: 'Keranjang', to: '/keranjang', icon: ShoppingBag, match: (p: string) => p === '/keranjang' || p === '/checkout', isCart: true },
  { label: 'Pesanan', to: '/pesanan', icon: ClipboardList, match: (p: string) => p.startsWith('/pesanan') },
  { label: 'Profil', to: '/profil', icon: User, match: (p: string) => p === '/profil' || p === '/login' || p === '/register' }
]
</script>

<template>
  <nav
    aria-label="Navigasi Mobile"
    class="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-pink-100 shadow-[0_-4px_20px_rgba(236,72,153,0.08)]"
  >
    <div class="grid grid-cols-5 h-16 px-1">
      <NuxtLink
        v-for="tab in tabs"
        :key="tab.to"
        :to="tab.to"
        class="relative flex flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors"
        :class="tab.match(route.path) ? 'text-[#EC4899]' : 'text-stone-400'"
      >
        <div class="relative">
          <component :is="tab.icon" class="w-5 h-5" />
          <span
            v-if="tab.isCart && cart.totalItems > 0"
            class="absolute -top-1.5 -right-2.5 min-w-4 h-4 px-1 rounded-full bg-[#EC4899] text-white text-[10px] font-bold flex items-center justify-center"
          >
            {{ cart.totalItems > 99 ? '99+' : cart.totalItems }}
          </span>
        </div>
        <span>{{ tab.label }}</span>
        <span
          v-if="tab.match(route.path)"
          class="absolute top-0 w-8 h-0.5 rounded-full bg-[#F472B6]"
        />
      </NuxtLink>
    </div>
  </nav>
</template>
