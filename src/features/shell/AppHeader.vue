<script setup lang="ts">
import BrandWordmark from '@/components/ui/BrandWordmark.vue';
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
    <BrandWordmark />
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
