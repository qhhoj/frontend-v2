<script setup lang="ts">
import { Bell } from 'lucide-vue-next';
import Drawer from 'primevue/drawer';
import { computed, ref } from 'vue';
import type { NotificationItem } from '@/api/types/notifications';
import EmptyState from '@/components/EmptyState.vue';
import QueryState from '@/components/QueryState.vue';
import AppButton from '@/components/ui/AppButton.vue';
import SettingsNotice from '@/features/account/settings/SettingsNotice.vue';
import { translate } from '@/i18n';
import { errorMessageKey } from '@/i18n/error-message';
import { useLocaleStore } from '@/stores/locale.store';
import { useSessionStore } from '@/stores/session.store';
import NotificationList from './NotificationList.vue';
import NotificationLoadError from './NotificationLoadError.vue';
import NotificationRowSkeleton from './NotificationRowSkeleton.vue';
import { NOTIFICATION_BITS } from './notification-bits';
import {
  DRAWER_QUERY,
  LATEST_ROWS,
  useMarkAllRead,
  useNotificationsQuery,
  useUnreadCountQuery,
} from './notifications.queries';
import { unreadBadge } from './use-notification-alerts';
import { useOpenNotification } from './use-open-notification';

/**
 * The bell beside the user menu (from `md`; a phone reaches notifications from the menu sheet); its drawer shows the
 * latest five rows. The live stream and the arrival announcements are the header's (`useNotificationAlerts`).
 */
const session = useSessionStore();
const locale = useLocaleStore();
const isOpen = ref(false);
const bellButton = ref<HTMLButtonElement | null>(null);
const countQuery = useUnreadCountQuery();
const listQuery = useNotificationsQuery(DRAWER_QUERY, isOpen);
const markAll = useMarkAllRead();
const opener = useOpenNotification();

const unread = computed(() => countQuery.data.value?.count ?? 0);
const badge = computed(() => unreadBadge(unread.value, locale.locale));
const latest = computed(() => (listQuery.data.value?.items ?? []).slice(0, LATEST_ROWS));
const bellLabel = computed(() =>
  unread.value > 0
    ? translate('notifications.bellWithCount', { count: unread.value })
    : translate('notifications.bell'),
);
async function openRow(item: NotificationItem) {
  if ((await opener.open(item)) === 'opened') isOpen.value = false;
}
const readAll = () => {
  if (!markAll.isPending.value) markAll.mutate();
};
/** The page already shows a refused "Đọc hết" (429); the drawer says it too. */
const readAllFailureKey = computed(() =>
  markAll.error.value ? errorMessageKey(markAll.error.value) : null,
);
/** Drawer is unstyled: these classes are its whole look. 430 px from `sm`, the full screen below (M1BPhone). */
const drawerPt = computed(() => ({
  root: {
    class:
      'flex h-full w-full flex-col border-l border-line-strong bg-surface-solid text-content sm:w-[430px]',
    'aria-label': translate('notifications.drawerTitle'),
  },
  header: { class: 'flex items-center justify-between gap-3 px-5 pt-5' },
  title: { class: 'font-display text-section leading-7 font-semibold' },
  pcCloseButton: {
    root: {
      class: 'inline-flex size-11 items-center justify-center rounded-full hover:bg-surface-hover',
    },
  },
  content: { class: 'flex-1 overflow-y-auto px-5 py-3' },
  footer: { class: 'px-5 pt-3 pb-5' },
  mask: { class: 'fixed inset-0 z-overlay flex justify-end bg-ground/70' },
}));
</script>

<template>
  <template v-if="session.user">
    <button
      ref="bellButton"
      type="button"
      data-testid="notification-bell"
      class="relative inline-flex size-11 items-center justify-center rounded-pill border border-line bg-surface-strong hover:bg-surface-hover"
      aria-haspopup="dialog"
      :aria-expanded="isOpen"
      :aria-label="bellLabel"
      :title="bellLabel"
      @click="isOpen = !isOpen"
    >
      <Bell aria-hidden="true" class="size-5" />
      <span
        v-if="badge"
        aria-hidden="true"
        data-testid="notification-badge"
        class="absolute -top-1 -right-1 min-w-5 rounded-pill bg-accent px-1.5 text-center text-xs leading-5 font-bold text-on-accent"
      >
        {{ badge }}
      </span>
    </button>
    <Drawer
      v-model:visible="isOpen"
      position="right"
      :header="$t('notifications.drawerTitle')"
      :pt="drawerPt"
      :close-button-props="{ 'aria-label': $t('common.close') }"
      @hide="bellButton?.focus()"
    >
      <div class="flex min-h-11 items-center justify-between gap-3 pb-2">
        <p class="text-sm text-muted">{{ $t('notifications.unreadCount', { count: unread }) }}</p>
        <button
          v-if="unread > 0 && opener.canMarkRead.value"
          type="button"
          class="min-h-11 rounded-pill px-3 text-sm font-semibold text-accent-text hover:bg-surface-hover"
          :aria-busy="markAll.isPending.value ? 'true' : undefined"
          @click="readAll"
        >
          {{ $t('notifications.readAll') }}
        </button>
      </div>
      <SettingsNotice
        v-if="!opener.canMarkRead.value"
        tone="info"
        :bit="NOTIFICATION_BITS.impersonating"
        class="mb-3"
      >
        {{ $t('notifications.impersonating') }}
      </SettingsNotice>
      <SettingsNotice
        v-if="readAllFailureKey"
        tone="error"
        :bit="NOTIFICATION_BITS.readAllFailed"
        class="mb-3"
      >
        {{ $t(readAllFailureKey) }}
      </SettingsNotice>
      <NotificationLoadError
        v-if="listQuery.error.value"
        :error="listQuery.error.value"
        @retry="listQuery.refetch()"
      />
      <QueryState
        v-else
        :loading="listQuery.isLoading.value"
        :error="null"
        :registers-wait="false"
        @retry="listQuery.refetch()"
      >
        <template #skeleton>
          <ul class="m-0 list-none p-0">
            <NotificationRowSkeleton v-for="index in LATEST_ROWS" :key="index" />
          </ul>
        </template>
        <EmptyState v-if="latest.length === 0" compact :kind="NOTIFICATION_BITS.empty">
          {{ $t('notifications.empty') }} {{ $t('notifications.emptyBody') }}
        </EmptyState>
        <NotificationList
          v-else
          :items="latest"
          :can-mark-read="opener.canMarkRead.value"
          :is-stale="opener.isStale"
          @open="openRow"
          @mark-read="opener.markRead"
        />
      </QueryState>
      <template #footer>
        <AppButton block :to="{ name: 'notifications' }" @click="isOpen = false">
          {{ $t('notifications.seeAll') }}
        </AppButton>
      </template>
    </Drawer>
  </template>
</template>
