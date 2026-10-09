<script setup lang="ts">
import { useSessionStore } from '@/stores/session.store';
import { computed } from 'vue';
import SettingsNotice from '@/features/account/settings/SettingsNotice.vue';
import { NOTIFICATION_BITS } from './notification-bits';
import { isTicketKind } from './notification-kinds';
import { useHighPriorityQuery } from './notifications.queries';
import { useOpenNotification } from './use-open-notification';

/** M1B: the newest unread important notification above the content until it is read. */
const query = useHighPriorityQuery();
const opener = useOpenNotification();
const item = computed(() => query.data.value?.items[0] ?? null);
/** M1B: "Xem phiếu" on a ticket notification, plain "Xem" otherwise. */
const openLabelKey = computed(() =>
  item.value !== null && isTicketKind(item.value.kind)
    ? 'notifications.banner.openTicket'
    : 'notifications.banner.open',
);
const BUTTON = 'inline-flex min-h-11 items-center rounded-pill px-4 font-semibold';
const session = useSessionStore();
</script>

<template>
  <!-- Always mounted, so a banner that arrives later is announced (assertive: it is the important one). -->
  <div v-if="session.user" aria-live="assertive">
    <section
      v-if="item"
      role="region"
      data-testid="high-priority-banner"
      :aria-label="$t('notifications.banner.region')"
      class="mx-auto w-full max-w-6xl px-4 pt-4 sm:px-8"
    >
      <SettingsNotice tone="info" :bit="NOTIFICATION_BITS.banner">
        <strong class="block text-xs tracking-wider uppercase">{{
          $t('notifications.banner.label')
        }}</strong>
        <span class="block font-semibold">{{ item.title }}</span>
        <span class="block">{{ item.body }}</span>
        <template #action>
          <span class="flex flex-wrap gap-2">
            <button
              type="button"
              :class="`${BUTTON} bg-accent text-on-accent`"
              @click="opener.open(item)"
            >
              {{ $t(openLabelKey) }}
            </button>
            <button
              v-if="opener.canMarkRead.value"
              type="button"
              :class="`${BUTTON} border border-current`"
              @click="opener.markRead(item)"
            >
              {{ $t('notifications.banner.markRead') }}
            </button>
          </span>
        </template>
      </SettingsNotice>
    </section>
  </div>
</template>
