<script setup lang="ts">
import AppearancePanel from '@/features/appearance/AppearancePanel.vue';
import NotificationBell from '@/features/notifications/NotificationBell.vue';
import OfficialModePill from '@/features/official-mode/OfficialModePill.vue';
import AppNav from './AppNav.vue';
import LocaleToggle from './LocaleToggle.vue';
import UserMenu from './UserMenu.vue';
</script>

<template>
  <header
    class="relative flex flex-wrap md:flex-nowrap items-center gap-x-5 gap-y-3 px-4 py-4 sm:px-8"
  >
    <RouterLink
      to="/"
      class="flex min-h-11 shrink-0 items-center gap-2.5 font-display text-xl font-bold text-content"
    >
      <span aria-hidden="true" class="bg-gradient-accent inline-block size-[30px] rounded-full" />
      {{ $t('app.name') }}
    </RouterLink>
    <OfficialModePill />
    <AppNav />
    <div class="ml-auto flex shrink-0 items-center gap-2">
      <LocaleToggle />
      <AppearancePanel />
      <NotificationBell />
      <UserMenu />
    </div>
  </header>
</template>
