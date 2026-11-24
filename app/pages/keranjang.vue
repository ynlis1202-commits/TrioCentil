<script setup lang="ts">
import {
  ShoppingBag,
  Trash2,
  Minus,
  Plus,
  Tag,
  ArrowRight,
  UtensilsCrossed,
  X
} from 'lucide-vue-next'
import { formatRupiah } from '~~/shared/utils/format'

useHead({ title: 'Keranjang Belanja' })

const cart = useCartStore()
const toast = useToast()

const promoInput = ref(cart.appliedPromo?.code || '')
const checkingPromo = ref(false)
const promoError = ref('')

const notesModel = computed({
  get: () => cart.orderNotes,
  set: (v: string) => cart.setOrderNotes(v)
})

const estimatedTotal = computed(() => Math.max(0, cart.subtotal - cart.discountAmount))

async function applyPromo() {
  if (!promoInput.value.trim()) return
  checkingPromo.value = true
  promoError.value = ''
  try {
    const res = await $fetch<{
      data: { code: string; title: string; discountAmount: number }
    }>('/api/promotions/validate', {
      method: 'POST',
      body: {
        code: promoInput.value.trim(),
        subtotal: cart.subtotal
      }
    })
    cart.setPromo(res.data)
    toast.add({
      title: 'Kode Promo Diterapkan!',
      description: `Hemat ${formatRupiah(res.data.discountAmount)} dengan ${res.data.code}.`,
      color: 'success'
    })
  } catch (err: any) {
    promoError.value = err?.data?.statusMessage || 'Kode promo tidak valid.'
    cart.setPromo(null)
  } finally {
    checkingPromo.value = false
  }
}

function removePromo() {
  cart.setPromo(null)
  promoInput.value = ''
  promoError.value = ''
}
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
    <div class="mb-8">
      <span class="text-xs font-bold uppercase tracking-wider text-[#EC4899]">Keranjang Belanja</span>
      <h1 class="font-display font-extrabold text-2xl sm:text-3xl text-[#292524] mt-1">
        Ringkasan Pesananmu
      </h1>
    </div>

    <!-- Empty Cart -->
    <div
      v-if="cart.items.length === 0"
      class="bg-white rounded-3xl border border-pink-100 p-10 sm:p-16 text-center max-w-xl mx-auto shadow-xs"
    >
      <div class="w-16 h-16 rounded-2xl bg-[#FFF5F8] text-[#EC4899] flex items-center justify-center mx-auto mb-4">
        <ShoppingBag class="w-8 h-8" />
      </div>
      <h2 class="font-display font-bold text-xl text-[#292524]">Keranjang Masih Kosong</h2>
      <p class="text-sm text-stone-500 mt-2">
        Yuk pilih sate ayam hangat, nasi pulen, lontong lembut, dan es segar favoritmu dulu!
      </p>
      <NuxtLink
        to="/menu"
        class="inline-flex items-center gap-2 mt-6 px-6 py-3 rounded-xl bg-[#EC4899] hover:bg-[#DB2777] text-white font-bold text-sm transition-colors"
      >
        <UtensilsCrossed class="w-4 h-4" />
        <span>Jelajahi Menu</span>
      </NuxtLink>
    </div>

    <!-- Cart Items + Summary -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <!-- Items List -->
      <div class="lg:col-span-8 space-y-4">
        <div
          v-for="item in cart.items"
          :key="item.key"
          class="bg-white rounded-2xl border border-pink-100 p-4 sm:p-5 shadow-xs flex gap-4"
        >
          <NuxtLink
            :to="`/menu/${item.slug}`"
            class="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-[#FFF5F8] shrink-0"
          >
            <img :src="item.image" :alt="item.name" class="w-full h-full object-cover">
          </NuxtLink>

          <div class="flex-1 min-w-0">
            <div class="flex items-start justify-between gap-2">
              <NuxtLink
                :to="`/menu/${item.slug}`"
                class="font-display font-bold text-[#292524] hover:text-[#EC4899] text-base leading-snug"
              >
                {{ item.name }}
              </NuxtLink>
              <button
                type="button"
                class="p-1.5 rounded-lg text-stone-400 hover:text-[#E11D48] hover:bg-red-50 transition-colors cursor-pointer"
                aria-label="Hapus produk"
                @click="cart.removeItem(item.key)"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>

            <!-- Options tags -->
            <div class="flex flex-wrap gap-1.5 mt-1.5 text-[11px]">
              <span
                v-if="item.spicyLevel"
                class="px-2 py-0.5 rounded-md bg-pink-50 text-[#9D174D] font-semibold"
              >
                Pedas: {{ item.spicyLevel }}
              </span>
              <span
                v-if="item.extraSambal && item.extraSambal.name !== 'Tanpa Tambahan'"
                class="px-2 py-0.5 rounded-md bg-red-50 text-[#E11D48] font-semibold"
              >
                + {{ item.extraSambal.name }}
              </span>
              <span
                v-for="v in item.selectedVariants || []"
                :key="v.id"
                class="px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 font-semibold"
              >
                {{ v.name }}
              </span>
            </div>

            <p v-if="item.itemNotes" class="text-xs text-stone-500 italic mt-1.5">
              Catatan: "{{ item.itemNotes }}"
            </p>

            <!-- Quantity & Subtotal -->
            <div class="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div class="inline-flex items-center gap-3 px-2.5 py-1.5 rounded-xl bg-[#FFF5F8] border border-pink-200">
                <button
                  type="button"
                  class="w-7 h-7 rounded-lg bg-white text-[#9D174D] flex items-center justify-center hover:bg-pink-100 cursor-pointer"
                  @click="cart.updateQuantity(item.key, item.quantity - 1)"
                >
                  <Minus class="w-3.5 h-3.5" />
                </button>
                <span class="font-bold text-sm w-6 text-center">{{ item.quantity }}</span>
                <button
                  type="button"
                  class="w-7 h-7 rounded-lg bg-white text-[#9D174D] flex items-center justify-center hover:bg-pink-100 cursor-pointer"
                  @click="cart.updateQuantity(item.key, item.quantity + 1)"
                >
                  <Plus class="w-3.5 h-3.5" />
                </button>
              </div>

              <div class="text-right">
                <p class="text-[11px] text-stone-400">
                  {{ formatRupiah(item.unitPrice) }} / porsi
                </p>
                <p class="font-display font-extrabold text-[#9D174D] text-base">
                  {{ formatRupiah(item.unitPrice * item.quantity) }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Catatan Pesanan -->
        <div class="bg-white rounded-2xl border border-pink-100 p-5 shadow-xs">
          <label for="order-notes" class="block text-sm font-bold text-[#292524] mb-2">
            Catatan Pesanan Keseluruhan (Opsional)
          </label>
          <textarea
            id="order-notes"
            v-model="notesModel"
            rows="2"
            placeholder="Contoh: Tolong sertakan sendok plastik dan tisu, terima kasih!"
            class="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:border-[#EC4899] outline-none text-sm resize-none"
          />
        </div>
      </div>

      <!-- Order Summary Card -->
      <aside class="lg:col-span-4 bg-white rounded-2xl border border-pink-100 p-6 shadow-sm sticky top-24 space-y-5">
        <h2 class="font-display font-bold text-lg text-[#292524]">Ringkasan Pembayaran</h2>

        <!-- Promo Code Box -->
        <div class="space-y-2">
          <label class="text-xs font-bold text-stone-600 flex items-center gap-1.5">
            <Tag class="w-3.5 h-3.5 text-[#EC4899]" />
            Punya Kode Promo?
          </label>
          <div v-if="cart.appliedPromo" class="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs">
            <div>
              <p class="font-bold text-emerald-800">{{ cart.appliedPromo.code }}</p>
              <p class="text-emerald-700">Hemat {{ formatRupiah(cart.appliedPromo.discountAmount) }}</p>
            </div>
            <button
              type="button"
              class="p-1 text-emerald-700 hover:text-red-600 cursor-pointer"
              @click="removePromo"
            >
              <X class="w-4 h-4" />
            </button>
          </div>
          <div v-else class="flex gap-2">
            <input
              v-model="promoInput"
              type="text"
              placeholder="Contoh: HEMAT10"
              class="flex-1 px-3 py-2 rounded-xl border border-stone-200 focus:border-[#EC4899] outline-none text-sm uppercase"
              @keyup.enter="applyPromo"
            >
            <button
              type="button"
              :disabled="checkingPromo || !promoInput.trim()"
              class="px-4 py-2 rounded-xl bg-[#9D174D] hover:bg-[#831843] disabled:opacity-50 text-white text-xs font-bold cursor-pointer"
              @click="applyPromo"
            >
              {{ checkingPromo ? '...' : 'Pakai' }}
            </button>
          </div>
          <p v-if="promoError" class="text-xs text-[#E11D48] font-medium">{{ promoError }}</p>
        </div>

        <!-- Totals -->
        <div class="space-y-2.5 pt-4 border-t border-pink-100 text-sm">
          <div class="flex justify-between text-stone-600">
            <span>Subtotal ({{ cart.totalItems }} item)</span>
            <span class="font-semibold text-[#292524]">{{ formatRupiah(cart.subtotal) }}</span>
          </div>
          <div v-if="cart.discountAmount > 0" class="flex justify-between text-emerald-700">
            <span>Diskon Promo</span>
            <span class="font-bold">-{{ formatRupiah(cart.discountAmount) }}</span>
          </div>
          <div class="flex justify-between text-xs text-stone-500">
            <span>Ongkos Kirim</span>
            <span>Dihitung saat checkout</span>
          </div>
          <div class="flex justify-between items-baseline pt-3 border-t border-pink-100">
            <span class="font-display font-bold text-[#292524]">Total Sementara</span>
            <span class="font-display font-extrabold text-xl text-[#9D174D]">
              {{ formatRupiah(estimatedTotal) }}
            </span>
          </div>
        </div>

        <NuxtLink
          to="/checkout"
          class="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-[#EC4899] hover:bg-[#DB2777] text-white font-bold text-sm shadow-md shadow-pink-500/20 transition-all"
        >
          <span>Lanjut ke Checkout</span>
          <ArrowRight class="w-4 h-4" />
        </NuxtLink>

        <NuxtLink
          to="/menu"
          class="block text-center text-xs font-semibold text-stone-500 hover:text-[#EC4899]"
        >
          + Tambah Menu Lainnya
        </NuxtLink>
      </aside>
    </div>
  </div>
</template>
