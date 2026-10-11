<script setup lang="ts">
import { keepPreviousData, useQuery } from '@tanstack/vue-query';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { fetchActivityLogs } from '@/api/activity-admin.api';
import type { ActivityLog } from '@/api/types/activity-admin';
import { formatNumericDateTimeSeconds } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import { useViewerId } from '@/stores/use-viewer-id';
import AdminChip from '../ui/AdminChip.vue';
import type { ChipTone } from '../ui/AdminChip.vue';
import AdminUserLabel from '../ui/AdminUserLabel.vue';
import { buttonClass } from '../ui/controls';
import AdminDataTable from '../ui/table/AdminDataTable.vue';
import type { AdminColumn } from '../ui/table/table-columns';
import { isFilteredActivity, toActivityRequest } from './activity';
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
const columns = computed<AdminColumn[]>(() => [
  { key: 'user', label: t('admin.activity.table.user'), priority: 'primary' },
  { key: 'at', label: t('admin.activity.table.at'), cellClass: 'whitespace-nowrap' },
  { key: 'ip', label: t('admin.activity.table.ip'), priority: 'meta', cellClass: 'font-mono' },
  {
    key: 'request',
    label: t('admin.activity.table.request'),
    cellClass: 'font-mono break-all min-w-48',
  },
  { key: 'status', label: t('admin.activity.table.status'), priority: 'badge' },
]);

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
      <button
        v-if="row.username"
        type="button"
        class="max-w-full rounded-cell text-left"
        :aria-label="$t('admin.activity.table.openSummary', { username: row.username })"
        @click="openSummary(row.username)"
      >
        <AdminUserLabel :username="row.username" :link="false" />
      </button>
      <span v-else class="text-muted">{{ $t('admin.activity.table.guest') }}</span>
    </template>
    <template #cell-status="{ row }">
      <AdminChip :tone="toneOf(row.statusCode)" class="font-mono">{{ row.statusCode }}</AdminChip>
    </template>
    <template #cell-at="{ row }">
      <time :datetime="row.at" class="font-mono text-sm tabular-nums">{{
        formatNumericDateTimeSeconds(row.at, locale.locale)
      }}</time>
    </template>
    <template #cell-request="{ row }">
      <span class="text-muted">{{ row.method }}</span> {{ row.path }}
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
