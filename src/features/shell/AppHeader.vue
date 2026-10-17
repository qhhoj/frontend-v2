<script setup lang="ts">
import BrandWordmark from '@/components/ui/BrandWordmark.vue';
import AppearancePanel from '@/features/appearance/AppearancePanel.vue';
import NotificationBell from '@/features/notifications/NotificationBell.vue';
import OfficialModePill from '@/features/official-mode/OfficialModePill.vue';
import { PHONE_QUERY, useMediaQuery } from '@/lib/use-media-query';
import AppNav from './AppNav.vue';
import LocaleToggle from './LocaleToggle.vue';
import PhoneMenu from './PhoneMenu.vue';
import UserMenu from './UserMenu.vue';

/**
 * One row at every width. On a phone (P-01 A) it is 56 px: the logo, the navigation strip, the bell (signed in: its badge
 * and live count) and a menu button whose sheet holds the language, the mode, the official-mode pill and the account.
 */
const isPhone = useMediaQuery(PHONE_QUERY);
</script>

<template>
  <header class="page-gutter relative flex items-center gap-x-2 py-1.5 md:gap-x-5 md:py-4">
    <BrandWordmark />
    <OfficialModePill v-if="!isPhone" />
    <AppNav />
    <div class="ml-auto flex shrink-0 items-center gap-2">
      <template v-if="!isPhone">
        <LocaleToggle />
        <AppearancePanel />
      </template>
      <NotificationBell />
      <PhoneMenu v-if="isPhone" />
      <UserMenu v-else />
    </div>
  </header>
</template>
