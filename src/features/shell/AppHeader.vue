<script setup lang="ts">
import BrandWordmark from '@/components/ui/BrandWordmark.vue';
import AppearancePanel from '@/features/appearance/AppearancePanel.vue';
import NotificationBell from '@/features/notifications/NotificationBell.vue';
import { useNotificationAlerts } from '@/features/notifications/use-notification-alerts';
import OfficialModePill from '@/features/official-mode/OfficialModePill.vue';
import { PHONE_QUERY, useMediaQuery } from '@/lib/use-media-query';
import AppNav from './AppNav.vue';
import LocaleToggle from './LocaleToggle.vue';
import PhoneMenu from './PhoneMenu.vue';
import UserMenu from './UserMenu.vue';

/**
 * One row at every width. On a phone (P-01 A) it is 56 px: the logo, the navigation strip and a menu button whose sheet
 * holds notifications, the language, the mode, the official-mode pill and the account (M-05: the bell moved there, so the
 * strip shows more items). The header owns the notification stream and announcements for both layouts.
 */
const isPhone = useMediaQuery(PHONE_QUERY);
const alerts = useNotificationAlerts();
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
      <PhoneMenu v-if="isPhone" :unread="alerts.unread.value" />
      <template v-else>
        <NotificationBell />
        <UserMenu />
      </template>
    </div>
    <p class="sr-only" aria-live="polite" data-testid="notification-arrived">
      {{ alerts.arrivedText.value }}
    </p>
  </header>
</template>
