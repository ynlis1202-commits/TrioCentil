<script setup lang="ts">
import {
  LayoutDashboard,
  UtensilsCrossed,
  FolderTree,
  ClipboardList,
  Users,
  BarChart3,
  Tag,
  Settings,
  LogOut,
  Bell,
  Menu as MenuIcon,
  X,
  ExternalLink
} from 'lucide-vue-next'
import { formatDateJakarta } from '~~/shared/utils/format'

const route = useRoute()
const auth = useAuthStore()
const sidebarOpen = ref(false)
const notifOpen = ref(false)

const navItems = [
  { label: 'Dashboard', to: '/admin', icon: LayoutDashboard },
  { label: 'Produk', to: '/admin/produk', icon: UtensilsCrossed },
  { label: 'Kategori', to: '/admin/kategori', icon: FolderTree },
  { label: 'Pesanan', to: '/admin/pesanan', icon: ClipboardList },
  { label: 'Pelanggan', to: '/admin/pelanggan', icon: Users },
  { label: 'Laporan Penjualan', to: '/admin/laporan', icon: BarChart3 },
  { label: 'Promo', to: '/admin/promo', icon: Tag },
  { label: 'Pengaturan', to: '/admin/pengaturan', icon: Settings }
]

interface AdminNotification {
  id: string
  title: string
  message: string
  orderId: string | null
  order?: { orderNumber: string } | null
  isRead: boolean
  createdAt: string
}

const { data: notifData, refresh: refreshNotifs } = await useFetch<{
  data: AdminNotification[]
  unreadCount: number
}>('/api/admin/notifications', {
  lazy: true,
  server: false
})

async function markAllRead() {
  await $fetch('/api/admin/notifications/all/read', { method: 'PATCH' })
  await refreshNotifs()
}

async function handleNotificationClick(n: AdminNotification) {
  notifOpen.value = false
  if (!n.isRead) {
    try {
      await $fetch(`/api/admin/notifications/${n.id}/read`, { method: 'PATCH' })
      await refreshNotifs()
    } catch {
      // Continue navigation even if mark-read fails
    }
  }

  const orderNum = n.order?.orderNumber || n.title.match(/#(TC-[\d-]+)/)?.[1]
  if (orderNum) {
    await navigateTo(`/admin/pesanan?search=${encodeURIComponent(orderNum)}`)
  } else {
    await navigateTo('/admin/pesanan')
  }
}

async function handleLogout() {
  await auth.logout()
  await navigateTo('/login')
}

watch(
  () => route.fullPath,
  () => {
    sidebarOpen.value = false
    notifOpen.value = false
  }
)
</script>

<template>
  <div class="min-h-screen bg-stone-50 text-[#292524] flex">
    <!-- Mobile Backdrop -->
    <div
      v-if="sidebarOpen"
      class="fixed inset-0 bg-black/40 z-40 lg:hidden"
      @click="sidebarOpen = false"
    />

    <!-- Sidebar -->
    <aside
      class="fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-[#1F1219] text-pink-50 flex flex-col transition-transform duration-200 shrink-0"
      :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'"
    >
      <div class="h-16 px-4 flex items-center justify-between border-b border-pink-950/80">
        <NuxtLink to="/admin">
          <BrandLogo light />
        </NuxtLink>
        <button
          type="button"
          class="lg:hidden p-1.5 rounded-lg text-pink-200 hover:bg-white/10"
          @click="sidebarOpen = false"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <nav class="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
          :class="
            route.path === item.to
              ? 'bg-gradient-to-r from-[#F472B6] to-[#EC4899] text-white shadow-sm'
              : 'text-pink-100/85 hover:bg-white/10 hover:text-white'
          "
        >
          <component :is="item.icon" class="w-4 h-4 shrink-0" />
          <span>{{ item.label }}</span>
        </NuxtLink>
      </nav>

      <div class="p-3 border-t border-pink-950/80 space-y-1.5">
        <NuxtLink
          to="/"
          target="_blank"
          class="flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-pink-200 hover:bg-white/10 hover:text-white transition-colors"
        >
          <ExternalLink class="w-4 h-4" />
          Lihat Website Toko
        </NuxtLink>
        <button
          type="button"
          class="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-200 hover:bg-rose-950/40 transition-colors cursor-pointer"
          @click="handleLogout"
        >
          <LogOut class="w-4 h-4" />
          Keluar ({{ auth.user?.name?.split(' ')[0] }})
        </button>
      </div>
    </aside>

    <!-- Main Content Area -->
    <div class="flex-1 flex flex-col min-w-0">
      <!-- Top Bar -->
      <header class="sticky top-0 z-30 h-16 bg-white border-b border-stone-200 px-4 sm:px-6 flex items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <button
            type="button"
            class="lg:hidden p-2 rounded-xl text-stone-600 hover:bg-stone-100"
            @click="sidebarOpen = true"
          >
            <MenuIcon class="w-5 h-5" />
          </button>
          <div>
            <h1 class="font-display font-bold text-stone-800 text-sm sm:text-base">
              Panel Admin Warung Makan TrioCentil
            </h1>
            <p class="text-[11px] text-stone-500 hidden sm:block">
              Kelola menu, pesanan, pelanggan, promo & laporan penjualan
            </p>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <!-- Internal Notifications Dropdown -->
          <div class="relative">
            <button
              type="button"
              class="relative p-2 rounded-xl bg-pink-50 text-[#9D174D] hover:bg-pink-100 transition-colors cursor-pointer"
              aria-label="Notifikasi Internal"
              @click="notifOpen = !notifOpen"
            >
              <Bell class="w-5 h-5" />
              <span
                v-if="(notifData?.unreadCount || 0) > 0"
                class="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-[#E11D48] text-white text-[10px] font-bold flex items-center justify-center"
              >
                {{ notifData?.unreadCount }}
              </span>
            </button>

            <div
              v-if="notifOpen"
              class="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl border border-stone-200 shadow-xl z-50 overflow-hidden"
            >
              <div class="px-4 py-3 border-b border-stone-100 flex items-center justify-between">
                <span class="font-bold text-sm text-stone-800">Notifikasi Internal</span>
                <button
                  v-if="(notifData?.unreadCount || 0) > 0"
                  type="button"
                  class="text-xs font-semibold text-[#EC4899] hover:underline cursor-pointer"
                  @click="markAllRead"
                >
                  Tandai semua dibaca
                </button>
              </div>
              <div class="max-h-80 overflow-y-auto divide-y divide-stone-100">
                <div
                  v-if="!notifData?.data?.length"
                  class="p-6 text-center text-xs text-stone-400"
                >
                  Belum ada notifikasi baru.
                </div>
                <button
                  v-for="n in notifData?.data || []"
                  :key="n.id"
                  type="button"
                  class="w-full text-left px-4 py-3 text-xs transition-colors hover:bg-pink-100/60 cursor-pointer flex items-start justify-between gap-2.5"
                  :class="n.isRead ? 'bg-white' : 'bg-[#FFF5F8]'"
                  @click="handleNotificationClick(n)"
                >
                  <div class="min-w-0 flex-1">
                    <p class="font-bold text-stone-800">{{ n.title }}</p>
                    <p class="text-stone-600 mt-0.5">{{ n.message }}</p>
                    <p class="text-[10px] text-stone-400 mt-1">{{ formatDateJakarta(n.createdAt) }}</p>
                  </div>
                  <span
                    v-if="!n.isRead"
                    class="w-2 h-2 rounded-full bg-[#EC4899] shrink-0 mt-1.5"
                    title="Belum dibaca"
                  />
                </button>
              </div>
            </div>
          </div>

          <!-- User Pill -->
          <div class="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-stone-100 text-xs font-semibold text-stone-700">
            <span class="w-2 h-2 rounded-full bg-emerald-500" />
            <span>{{ auth.user?.name || 'Admin' }}</span>
            <span class="px-1.5 py-0.5 rounded bg-pink-100 text-[#9D174D] text-[10px]">
              {{ auth.user?.role }}
            </span>
          </div>
        </div>
      </header>

      <!-- Page Slot -->
      <main class="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
        <slot />
      </main>
    </div>
  </div>
</template>
