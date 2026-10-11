<script setup lang="ts">
import { keepPreviousData, useQuery } from '@tanstack/vue-query';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { fetchActivityLogs } from '@/api/activity-admin.api';
import type { ActivityLog } from '@/api/types/activity-admin';
import {
  formatClockSeconds,
  formatNumericDate,
  formatNumericDateTimeSeconds,
  formatShortDate,
} from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import { useViewerId } from '@/stores/use-viewer-id';
import AdminChip from '../ui/AdminChip.vue';
import type { ChipTone } from '../ui/AdminChip.vue';
import AdminUserLabel from '../ui/AdminUserLabel.vue';
import { buttonClass } from '../ui/controls';
import AdminDataTable from '../ui/table/AdminDataTable.vue';
import type { AdminColumn } from '../ui/table/table-columns';
import ActivityIp from './ActivityIp.vue';
import { dayStartIds, isFilteredActivity, toActivityRequest } from './activity';
import type { ActivityFilter } from './activity';

const props = defineProps<{ filter: ActivityFilter }>();
defineEmits<{ 'clear-filters': [] }>();
const route = useRoute();
const router = useRouter();
const locale = useLocaleStore();
const viewer = useViewerId();
const { t } = useI18n();
/** Backend `@Max(200)` on `page`: a request for page 201 is a 400. */
const MAX_ACTIVITY_PAGE = 200;
const page = ref(1);

const request = computed(() => ({ ...toActivityRequest(props.filter), page: page.value }));
const logs = useQuery({
  queryKey: computed(() => ['admin', 'activity', 'logs', request.value, viewer.value]),
  queryFn: () => fetchActivityLogs(request.value),
  placeholderData: keepPreviousData,
});

/** A new filter starts at the first page; the previous rows stay on screen until the new ones arrive. */
watch(
  () => JSON.stringify(props.filter),
  () => {
    page.value = 1;
  },
);

const rows = computed(() => logs.data.value?.items ?? []);
const hasNext = computed(() => !!logs.data.value?.meta.hasMore && page.value < MAX_ACTIVITY_PAGE);
/** The time and the address sit under the user and the path, so three columns carry five facts and the table never scrolls sideways. */
const columns = computed<AdminColumn[]>(() => [
  {
    key: 'user',
    label: t('admin.activity.table.user'),
    priority: 'primary',
    cellClass: 'w-56 max-w-56',
  },
  { key: 'request', label: t('admin.activity.table.request'), grow: true },
  { key: 'status', label: t('admin.activity.table.status'), priority: 'badge' },
]);
/** A time alone says little across a page of days: the first row of each day also carries the date. */
const dayStarts = computed(() =>
  dayStartIds(rows.value, (at) => formatNumericDate(at, locale.locale)),
);

/** A name opens that user's summary beside the table; the rest of the URL (the filter) stays. */
function openSummary(username: string) {
  void router.replace({ query: { ...route.query, summary: username } });
}

/** Server errors and refusals stand out; the text (the code) carries the meaning. */
const toneOf = (statusCode: number): ChipTone =>
  statusCode >= 500 ? 'negative' : statusCode >= 400 ? 'caution' : 'neutral';
const goTo = (next: number) => (page.value = next);
</script>

<template>
  <AdminDataTable
    data-testid="activity-table"
    :columns="columns"
    :rows="rows"
    :row-key="(row: ActivityLog) => row.id"
    :label="$t('admin.activity.table.caption')"
    :loading="logs.isPending.value"
    :error="logs.error.value"
    :filtered="isFilteredActivity(filter)"
    :empty-text="$t('admin.activity.table.empty')"
    :skeleton-rows="6"
    @retry="logs.refetch()"
    @clear-filters="$emit('clear-filters')"
  >
    <template #cell-user="{ row }">
      <div class="flex min-w-0 flex-col items-start gap-0.5 py-1">
        <button
          v-if="row.username"
          type="button"
          class="max-w-full min-w-0 rounded-cell text-left"
          :aria-label="$t('admin.activity.table.openSummary', { username: row.username })"
          @click="openSummary(row.username)"
        >
          <AdminUserLabel :username="row.username" :link="false" class="max-w-full" />
        </button>
        <span v-else class="text-muted">{{ $t('admin.activity.table.guest') }}</span>
        <time
          :datetime="row.at"
          class="font-mono text-xs whitespace-nowrap text-muted tabular-nums"
          :title="formatNumericDateTimeSeconds(row.at, locale.locale)"
        >
          <template v-if="dayStarts.has(row.id)"
            >{{ formatShortDate(row.at, locale.locale) }} ·
          </template>
          {{ formatClockSeconds(row.at, locale.locale) }}
        </time>
      </div>
    </template>
    <template #cell-request="{ row }">
      <div class="flex min-w-0 flex-col gap-0.5 py-1 font-mono">
        <span class="break-all md:truncate" :title="`${row.method} ${row.path}`">
          <span class="text-muted">{{ row.method }}</span> {{ row.path }}
        </span>
        <ActivityIp :ip="row.ip" class="text-xs text-muted" />
      </div>
    </template>
    <template #cell-status="{ row }">
      <AdminChip :tone="toneOf(row.statusCode)" class="font-mono">{{ row.statusCode }}</AdminChip>
    </template>
    <template #footer>
      <span>{{ $t('admin.activity.table.page', { page }) }}</span>
      <span class="ml-auto flex gap-2">
        <button
          type="button"
          :class="buttonClass('secondary', 'sm')"
          :aria-disabled="page <= 1 || undefined"
          @click="page > 1 && goTo(page - 1)"
        >
          {{ $t('admin.activity.table.previous') }}
        </button>
        <button
          v-if="hasNext"
          type="button"
          :class="buttonClass('secondary', 'sm')"
          @click="goTo(page + 1)"
        >
          {{ $t('admin.activity.table.next') }}
        </button>
      </span>
    </template>
  </AdminDataTable>
</template>
