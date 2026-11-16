<script setup lang="ts">
import { Bell } from 'lucide-vue-next';
import { computed, ref } from 'vue';
import type { NotificationItem } from '@/api/types/notifications';
import EmptyState from '@/components/EmptyState.vue';
import QueryState from '@/components/QueryState.vue';
import AppButton from '@/components/ui/AppButton.vue';
import Drawer from '@/components/ui/Drawer.vue';
import IconButton from '@/components/ui/IconButton.vue';
import SettingsNotice from '@/features/account/settings/SettingsNotice.vue';
import { translate } from '@/i18n';
import { useLocaleStore } from '@/stores/locale.store';
import { useSessionStore } from '@/stores/session.store';
import MarkAllReadButton from './MarkAllReadButton.vue';
import NotificationList from './NotificationList.vue';
import NotificationLoadError from './NotificationLoadError.vue';
import NotificationRowSkeleton from './NotificationRowSkeleton.vue';
import { NOTIFICATION_BITS } from './notification-bits';
import {
  DRAWER_QUERY,
  LATEST_ROWS,
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
const countQuery = useUnreadCountQuery();
const listQuery = useNotificationsQuery(DRAWER_QUERY, isOpen);
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
/** The page already shows a refused "Đọc hết" (429); the drawer says it too. */
const readAllFailureKey = ref<string | null>(null);
</script>

<template>
  <template v-if="session.user">
    <IconButton
      tone="secondary"
      data-testid="notification-bell"
      class="relative"
      aria-haspopup="dialog"
      :aria-expanded="isOpen"
      :label="bellLabel"
      @click="isOpen = !isOpen"
    >
      <Bell aria-hidden="true" class="size-5" />
      <span
        v-if="badge"
        aria-hidden="true"
        data-testid="notification-badge"
        class="absolute -top-1 -right-1 min-w-5 rounded-pill bg-accent px-1.5 text-center text-caption leading-5 font-bold text-on-accent"
      >
        {{ badge }}
      </span>
    </IconButton>
    <Drawer v-model:visible="isOpen" :title="$t('notifications.drawerTitle')" size="sm">
      <div class="flex min-h-11 items-center justify-between gap-3 pb-2">
        <p class="text-sm text-muted">{{ $t('notifications.unreadCount', { count: unread }) }}</p>
        <MarkAllReadButton
          v-if="unread > 0 && opener.canMarkRead.value"
          tone="link"
          @failed="readAllFailureKey = $event"
        />
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
