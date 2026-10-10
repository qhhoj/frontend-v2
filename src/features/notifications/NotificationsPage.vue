<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { NOTIFICATION_STATES } from '@/api/types/notifications';
import EmptyState from '@/components/EmptyState.vue';
import GlassCard from '@/components/GlassCard.vue';
import InlineBit from '@/components/InlineBit.vue';
import NumberedPager from '@/components/NumberedPager.vue';
import QueryState from '@/components/QueryState.vue';
import SettingsNotice from '@/features/account/settings/SettingsNotice.vue';
import { translate } from '@/i18n';
import { errorMessageKey } from '@/i18n/error-message';
import { formatNumber } from '@/lib/format';
import { pageFromQuery } from '@/lib/paging';
import { useLocaleStore } from '@/stores/locale.store';
import NotificationList from './NotificationList.vue';
import NotificationsPageSkeleton from './NotificationsPageSkeleton.vue';
import { NOTIFICATION_BITS } from './notification-bits';
import { filterLink, kindGroupFromQuery, stateFromQuery } from './notification-filters';
import { KIND_GROUPS, kindsOfGroup } from './notification-kinds';
import NotificationLoadError from './NotificationLoadError.vue';
import {
  DRAWER_QUERY,
  useMarkAllRead,
  useNotificationsQuery,
  useUnreadCountQuery,
} from './notifications.queries';
import { useOpenNotification } from './use-open-notification';

/** M1B page: a status rail (chips on a phone), the inbox grouped by day, "Đánh dấu tất cả đã đọc". */
const route = useRoute();
const locale = useLocaleStore();
const state = computed(() => stateFromQuery(route.query.state));
const group = computed(() => kindGroupFromQuery(route.query.kind));
/** `kind` is the repeatable query of the B1 ask (requires VNOI backend B1 ask). */
const query = computed(() => ({
  state: state.value,
  page: pageFromQuery(route.query.page),
  ...(group.value === null ? {} : { kind: kindsOfGroup(group.value) }),
}));
const listQuery = useNotificationsQuery(query);
const countQuery = useUnreadCountQuery();
/** The board's rail counts: all (the drawer's own read, shared), unread (the poll), read = all - unread. */
const allQuery = useNotificationsQuery(DRAWER_QUERY);
const markAll = useMarkAllRead();
const opener = useOpenNotification();

const items = computed(() => listQuery.data.value?.items ?? []);
const meta = computed(() => listQuery.data.value?.meta);
const unread = computed(() => countQuery.data.value?.count ?? 0);
const totals = computed(() => {
  const all = allQuery.data.value?.meta.total;
  return all === undefined
    ? null
    : { all, unread: unread.value, read: Math.max(all - unread.value, 0) };
});
const stateSuffix = computed(() => translate(`notifications.stateSuffix.${state.value}`));
const hasMorePages = computed(() => (meta.value?.total ?? 0) > (meta.value?.pageSize ?? Infinity));
const canReadAll = computed(() => unread.value > 0 && opener.canMarkRead.value);
const readAllFailureKey = computed(() =>
  markAll.error.value ? errorMessageKey(markAll.error.value) : null,
);
const readAll = () => {
  if (!markAll.isPending.value) markAll.mutate();
};
const FILTER_CLASS =
  'inline-flex min-h-11 items-center justify-between gap-3 rounded-pill px-4 text-sm whitespace-nowrap';
</script>

<template>
  <div class="mx-auto flex max-w-5xl flex-col gap-5 px-4 py-6 sm:px-8">
    <header class="flex flex-wrap items-end justify-between gap-4 pt-3 pb-1">
      <div class="flex items-center gap-3">
        <InlineBit :kind="NOTIFICATION_BITS.header" />
        <div>
          <h1 class="page-title">
            {{ $t('notifications.title') }}
          </h1>
          <p class="mt-2 text-muted">{{ $t('notifications.lead') }}</p>
        </div>
      </div>
      <button
        v-if="canReadAll"
        type="button"
        class="inline-flex min-h-11 items-center rounded-pill border border-line px-5 font-semibold hover:bg-surface-hover"
        :aria-busy="markAll.isPending.value ? 'true' : undefined"
        @click="readAll"
      >
        {{ $t('notifications.readAllLong') }}
      </button>
    </header>
    <SettingsNotice
      v-if="!opener.canMarkRead.value"
      tone="info"
      :bit="NOTIFICATION_BITS.impersonating"
    >
      {{ $t('notifications.impersonating') }}
    </SettingsNotice>
    <SettingsNotice v-if="markAll.isSuccess.value" tone="success" :bit="NOTIFICATION_BITS.allRead">
      {{ $t('notifications.readAllDone') }}
    </SettingsNotice>
    <SettingsNotice
      v-else-if="readAllFailureKey"
      tone="error"
      :bit="NOTIFICATION_BITS.readAllFailed"
    >
      {{ $t(readAllFailureKey) }}
    </SettingsNotice>
    <SettingsNotice v-if="opener.lastStaleId.value" tone="warning" :bit="NOTIFICATION_BITS.stale">
      {{ $t('notifications.staleOpened') }}
    </SettingsNotice>
    <div class="grid gap-5 lg:grid-cols-[13rem_minmax(0,1fr)]">
      <nav
        :aria-label="`${$t('notifications.statusLabel')}, ${$t('notifications.kindLabel')}`"
        class="flex gap-1 overflow-x-auto lg:flex-col lg:self-start"
      >
        <p
          class="hidden px-4 pb-1 text-xs font-semibold tracking-wider text-muted uppercase lg:block"
        >
          {{ $t('notifications.statusLabel') }}
        </p>
        <RouterLink
          v-for="option in NOTIFICATION_STATES"
          :key="option"
          :to="filterLink(option, group)"
          :aria-current="option === state ? 'page' : undefined"
          :class="[
            FILTER_CLASS,
            option === state
              ? 'bg-accent-soft font-semibold text-accent-soft-text'
              : 'text-muted hover:bg-surface-hover hover:text-content',
          ]"
        >
          <span>{{ $t(`notifications.filters.${option}`) }}</span>
          <span v-if="totals" class="tabular-nums">
            {{ formatNumber(totals[option], locale.locale) }}
          </span>
        </RouterLink>
        <p
          class="hidden px-4 pt-3 pb-1 text-xs font-semibold tracking-wider text-muted uppercase lg:block"
        >
          {{ $t('notifications.kindLabel') }}
        </p>
        <RouterLink
          v-for="option in KIND_GROUPS"
          :key="option"
          :to="filterLink(state, option === group ? null : option)"
          :aria-current="option === group ? 'page' : undefined"
          :class="[
            FILTER_CLASS,
            option === group
              ? 'bg-accent-soft font-semibold text-accent-soft-text'
              : 'text-muted hover:bg-surface-hover hover:text-content',
          ]"
        >
          {{ $t(`notifications.kinds.${option}`) }}
        </RouterLink>
      </nav>
      <GlassCard
        as="section"
        data-testid="notifications-card"
        class="p-4 sm:p-6"
        :aria-label="$t('notifications.title')"
      >
        <NotificationLoadError
          v-if="listQuery.error.value"
          :error="listQuery.error.value"
          @retry="listQuery.refetch()"
        />
        <QueryState
          v-else
          :loading="listQuery.isLoading.value"
          :error="null"
          @retry="listQuery.refetch()"
        >
          <template #skeleton><NotificationsPageSkeleton /></template>
          <template v-if="items.length === 0">
            <EmptyState v-if="state === 'all' && group === null">
              {{ $t('notifications.empty') }} {{ $t('notifications.emptyBody') }}
            </EmptyState>
            <EmptyState v-else compact :kind="NOTIFICATION_BITS.empty">
              <strong class="block">
                {{
                  group === null
                    ? $t(`notifications.filteredEmpty.${state}`)
                    : $t('notifications.filteredEmpty.kind', {
                        kind: $t(`notifications.kinds.${group}`),
                        state: stateSuffix,
                      })
                }}
              </strong>
              <span class="block">{{ $t('notifications.filteredHint') }}</span>
              <RouterLink
                :to="filterLink('all')"
                class="inline-flex min-h-11 items-center font-semibold text-accent-text"
              >
                {{ $t('notifications.clearFilters') }}
              </RouterLink>
            </EmptyState>
          </template>
          <template v-else>
            <NotificationList
              :items="items"
              :can-mark-read="opener.canMarkRead.value"
              :is-stale="opener.isStale"
              @open="(item) => void opener.open(item)"
              @mark-read="opener.markRead"
            />
            <footer
              v-if="meta && hasMorePages"
              class="mt-4 flex justify-end border-t border-line pt-3"
            >
              <NumberedPager :meta="meta" :label="$t('notifications.pager')" />
            </footer>
          </template>
        </QueryState>
      </GlassCard>
    </div>
  </div>
</template>
