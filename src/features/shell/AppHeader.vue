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
    class="page-gutter relative flex flex-wrap items-center gap-x-5 gap-y-3 py-4 md:flex-nowrap"
  >
    <RouterLink
      to="/"
      class="flex min-h-11 shrink-0 items-center gap-2.5 font-display text-[17px] font-bold text-accent-text"
    >
      <span aria-hidden="true" class="bg-gradient-accent inline-block size-[28px] rounded-full" />
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
