<script setup lang="ts">
const cart = useCartStore()
const auth = useAuthStore()
const storefront = useStorefrontStore()

onMounted(() => {
  cart.hydrate()
  auth.fetchMe()
  storefront.fetchSettings()
})
</script>

<template>
  <UApp>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
