<script setup lang="ts">
import { Check, Clock, Flame, PackageCheck, Truck, CheckCircle2, XCircle } from 'lucide-vue-next'
import type { OrderStatus, OrderType } from '~~/shared/types'
import { ORDER_STATUS_META } from '~~/shared/utils/format'

const props = defineProps<{
  status: OrderStatus
  orderType: OrderType
}>()

const steps = computed(() => [
  { key: 'PENDING_CONFIRMATION', label: 'Menunggu Konfirmasi', icon: Clock, index: 0 },
  { key: 'CONFIRMED', label: 'Dikonfirmasi', icon: Check, index: 1 },
  { key: 'COOKING', label: 'Sedang Dimasak', icon: Flame, index: 2 },
  props.orderType === 'DELIVERY'
    ? { key: 'OUT_FOR_DELIVERY', label: 'Sedang Diantar', icon: Truck, index: 3 }
    : { key: 'READY_FOR_PICKUP', label: 'Siap Diambil', icon: PackageCheck, index: 3 },
  { key: 'COMPLETED', label: 'Selesai', icon: CheckCircle2, index: 4 }
])

const currentStepIndex = computed(() => ORDER_STATUS_META[props.status]?.stepIndex ?? 0)
</script>

<template>
  <div>
    <!-- Cancelled Banner -->
    <div
      v-if="status === 'CANCELLED'"
      class="flex items-center gap-3 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800"
    >
      <XCircle class="w-6 h-6 text-[#DC2626] shrink-0" />
      <div>
        <p class="font-bold text-sm">Pesanan Dibatalkan</p>
        <p class="text-xs text-red-700 mt-0.5">
          Pesanan ini telah dibatalkan. Hubungi WhatsApp kami jika Anda memerlukan bantuan.
        </p>
      </div>
    </div>

    <!-- Active Progress Steps -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-5 gap-3 sm:gap-2">
      <div
        v-for="step in steps"
        :key="step.key"
        class="flex sm:flex-col items-center gap-3 sm:gap-2 p-3 sm:p-2 rounded-xl transition-all"
        :class="
          currentStepIndex >= step.index
            ? 'bg-[#FFF5F8] sm:bg-transparent'
            : 'bg-stone-50/70 sm:bg-transparent opacity-60'
        "
      >
        <div
          class="w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2 transition-colors"
          :class="
            currentStepIndex > step.index
              ? 'bg-emerald-500 border-emerald-500 text-white'
              : currentStepIndex === step.index
                ? 'bg-[#EC4899] border-[#EC4899] text-white shadow-md shadow-pink-500/30'
                : 'bg-white border-stone-200 text-stone-400'
          "
        >
          <Check v-if="currentStepIndex > step.index" class="w-5 h-5" />
          <component :is="step.icon" v-else class="w-5 h-5" />
        </div>
        <span
          class="text-xs sm:text-center font-semibold leading-tight"
          :class="currentStepIndex >= step.index ? 'text-[#292524]' : 'text-stone-400'"
        >
          {{ step.label }}
        </span>
      </div>
    </div>
  </div>
</template>
