<script setup lang="ts">
import { useRoute } from 'vue-router';
import AppButton from '@/components/ui/AppButton.vue';
import BrandWordmark from '@/components/ui/BrandWordmark.vue';
import AppearancePanel from '@/features/appearance/AppearancePanel.vue';
import NotificationBell from '@/features/notifications/NotificationBell.vue';
import { useNotificationAlerts } from '@/features/notifications/use-notification-alerts';
import OfficialModePill from '@/features/official-mode/OfficialModePill.vue';
import { PHONE_QUERY, useMediaQuery } from '@/lib/use-media-query';
import { useIsFirstNavigationPending } from '@/router/first-navigation';
import { useSessionStore } from '@/stores/session.store';
import AppNav from './AppNav.vue';
import LocaleToggle from './LocaleToggle.vue';
import PhoneMenu from './PhoneMenu.vue';
import UserMenu from './UserMenu.vue';

/**
 * One row at every width. On a phone it is 56 px: the logo, then sign-in for a visitor or the bell for a member, and
 * a menu button whose sheet lists the sections, the account, the language and the mode. The header owns the
 * notification stream and announcements for both layouts.
 */
const isPhone = useMediaQuery(PHONE_QUERY);
const session = useSessionStore();
const route = useRoute();
/** Until the session answers the header offers neither sign-in nor the bell. */
const isSessionPending = useIsFirstNavigationPending();
const alerts = useNotificationAlerts();
</script>

<template>
  <!-- `data-page-column`: the loading Bits keep to the gutters beside this column (`pageColumn`). -->
  <header
    data-page-column
    class="page-gutter relative flex items-center gap-x-2 py-1.5 md:gap-x-5 md:py-4"
  >
    <BrandWordmark />
    <OfficialModePill v-if="!isPhone" />
    <AppNav v-if="!isPhone" />
    <div class="ml-auto flex shrink-0 items-center gap-2">
      <template v-if="!isPhone">
        <LocaleToggle />
        <AppearancePanel />
      </template>
      <template v-if="isPhone">
        <NotificationBell />
        <AppButton
          v-if="!session.user && !isSessionPending"
          :to="{ name: 'login', query: { redirect: route.fullPath } }"
        >
          {{ $t('account.login') }}
        </AppButton>
        <PhoneMenu />
      </template>
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
