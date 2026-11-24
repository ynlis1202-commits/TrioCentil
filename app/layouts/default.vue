<template>
  <div class="min-h-screen flex flex-col bg-[#FFF9FB] text-[#292524]">
    <AppHeader />
    <main class="flex-1 pb-safe-nav md:pb-0">
      <slot />
    </main>
    <AppFooter class="hidden md:block" />
    <div class="md:hidden pb-16">
      <AppFooter />
    </div>
    <MobileBottomNav />
  </div>
</template>
