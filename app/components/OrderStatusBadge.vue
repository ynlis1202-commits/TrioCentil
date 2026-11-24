<script setup lang="ts">
import type { OrderStatus } from '~~/shared/types'
import { ORDER_STATUS_META } from '~~/shared/utils/format'

const props = defineProps<{
  status: OrderStatus
}>()

const meta = computed(() => ORDER_STATUS_META[props.status] || ORDER_STATUS_META.PENDING_CONFIRMATION)
</script>

<template>
  <span
    class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap"
    :class="[meta.bgClass, meta.textClass]"
  >
    <span class="w-1.5 h-1.5 rounded-full bg-current" />
    {{ meta.label }}
  </span>
</template>
