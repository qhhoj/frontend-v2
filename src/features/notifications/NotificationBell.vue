<script setup lang="ts">
import { Bell } from 'lucide-vue-next';
import Drawer from 'primevue/drawer';
import { computed, onScopeDispose, ref, watch } from 'vue';
import type { NotificationItem } from '@/api/types/notifications';
import EmptyState from '@/components/EmptyState.vue';
import QueryState from '@/components/QueryState.vue';
import SettingsNotice from '@/features/account/settings/SettingsNotice.vue';
import { translate } from '@/i18n';
import { errorMessageKey } from '@/i18n/error-message';
import { formatNumber } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import { useSessionStore } from '@/stores/session.store';
import NotificationList from './NotificationList.vue';
import NotificationLoadError from './NotificationLoadError.vue';
import NotificationRowSkeleton from './NotificationRowSkeleton.vue';
import { NOTIFICATION_BITS } from './notification-bits';
import {
  DRAWER_QUERY,
  LATEST_ROWS,
  useInvalidateNotificationLists,
  useMarkAllRead,
  useNotificationsQuery,
  useUnreadCountQuery,
} from './notifications.queries';
import { useNotificationStream } from './use-notification-stream';
import { useOpenNotification } from './use-open-notification';

/** M1B: the bell beside the user menu; its drawer shows the latest five rows (full screen on a phone). */
const BADGE_MAX = 99;
const session = useSessionStore();
const locale = useLocaleStore();
const isOpen = ref(false);
const bellButton = ref<HTMLButtonElement | null>(null);
const countQuery = useUnreadCountQuery();
const listQuery = useNotificationsQuery(DRAWER_QUERY, isOpen);
const markAll = useMarkAllRead();
const invalidateLists = useInvalidateNotificationLists();
const opener = useOpenNotification();
useNotificationStream();

const unread = computed(() => countQuery.data.value?.count ?? 0);
const badge = computed(() => {
  if (unread.value <= 0) return '';
  return unread.value > BADGE_MAX ? `${BADGE_MAX}+` : formatNumber(unread.value, locale.locale);
});
const latest = computed(() => (listQuery.data.value?.items ?? []).slice(0, LATEST_ROWS));
/** Polite, counts only: said when the count rises, never per row. */
const arrivedText = ref('');
/** The gap between emptying and refilling the region: shorter than a frame and browsers merge the two, so an identical text goes unread. */
const REANNOUNCE_GAP_MS = 100;
let announceTimer: ReturnType<typeof setTimeout> | undefined;
/** Cleared first, so two identical rises ("1 thông báo mới" twice) still change the region and are read again. */
function announceArrivals(gained: number) {
  clearTimeout(announceTimer);
  arrivedText.value = '';
  if (gained > 0)
    announceTimer = setTimeout(
      () => (arrivedText.value = translate('notifications.arrived', { count: gained })),
      REANNOUNCE_GAP_MS,
    );
}
onScopeDispose(() => clearTimeout(announceTimer));
watch(
  () => countQuery.data.value?.count,
  (count, before) => {
    const hasRisen = count !== undefined && before !== undefined && count > before;
    announceArrivals(hasRisen ? count - before : 0);
    // Contest announcements are `high` and send no nudge (B1): only the polled count tells the banner and the lists.
    if (hasRisen) void invalidateLists();
  },
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
  title: { class: 'font-display text-xl font-semibold' },
  pcCloseButton: {
    root: {
      class: 'inline-flex size-11 items-center justify-center rounded-full hover:bg-surface-hover',
    },
  },
  content: { class: 'flex-1 overflow-y-auto px-5 py-3' },
  footer: { class: 'px-5 pt-3 pb-5' },
  mask: { class: 'fixed inset-0 z-50 flex justify-end bg-ground/70' },
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
      :aria-label="
        unread ? $t('notifications.bellWithCount', { count: unread }) : $t('notifications.bell')
      "
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
    <p class="sr-only" aria-live="polite" data-testid="notification-arrived">{{ arrivedText }}</p>
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
        <RouterLink
          :to="{ name: 'notifications' }"
          class="inline-flex min-h-11 w-full items-center justify-center rounded-pill border border-line font-semibold hover:bg-surface-hover"
          @click="isOpen = false"
        >
          {{ $t('notifications.seeAll') }}
        </RouterLink>
      </template>
    </Drawer>
  </template>
</template>
