<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { SubmissionBatchLog } from '@/api/types/submission-actions';
import { formatNumber } from '@/lib/format';
import { formatDate } from '@/lib/format-date';
import { useLocaleStore } from '@/stores/locale.store';
import AdminDataTable from '../ui/table/AdminDataTable.vue';
import type { AdminColumn } from '../ui/table/table-columns';
import { useRecentBatchesQuery } from './batches.queries';

/** The latest rejudge and rescore runs: what, how many, who, the filter and when. Cards below 768 px. */
const { data, isPending, error, refetch } = useRecentBatchesQuery();
const { t } = useI18n();
const locale = useLocaleStore();
const FILTER_KEYS = ['contest', 'problem', 'user', 'judgedOn'] as const;

const columns = computed<AdminColumn[]>(() => [
  { key: 'action', label: t('admin.rejudge.history.columns.action'), priority: 'primary' },
  { key: 'count', label: t('admin.rejudge.history.columns.count'), align: 'end' },
  { key: 'user', label: t('admin.rejudge.history.columns.user') },
  { key: 'filter', label: t('admin.rejudge.history.columns.filter'), cellClass: 'max-w-96' },
  { key: 'createdAt', label: t('admin.rejudge.history.columns.createdAt'), priority: 'meta' },
]);

/** The named parts of a logged filter, `key=value`; a selection by id is told by its size. */
function filterText(entry: SubmissionBatchLog): string {
  const parts = FILTER_KEYS.flatMap((key) =>
    entry.filter[key] ? [`${key}=${entry.filter[key]}`] : [],
  );
  if (entry.filter.results?.length) parts.push(`results=${entry.filter.results.join(',')}`);
  if (entry.filter.ids?.length) parts.push(`ids×${entry.filter.ids.length}`);
  return parts.join(' · ') || '—';
}
</script>

<template>
  <section class="flex flex-col gap-3" aria-labelledby="recent-batches">
    <h2 id="recent-batches" class="font-display text-base font-semibold">
      {{ $t('admin.rejudge.history.title') }}
    </h2>
    <AdminDataTable
      :columns="columns"
      :rows="data ?? []"
      :row-key="(entry) => entry.id"
      :label="$t('admin.rejudge.history.title')"
      :loading="isPending"
      :error="error"
      :skeleton-rows="3"
      :empty-text="$t('admin.rejudge.history.empty')"
      @retry="refetch()"
    >
      <template #cell-action="{ row }">
        <span class="font-semibold">{{ $t(`admin.rejudge.history.${row.action}`) }}</span>
      </template>
      <template #cell-count="{ row }">{{ formatNumber(row.count, locale.locale) }}</template>
      <template #cell-user="{ row }">{{ row.user?.username ?? '—' }}</template>
      <template #cell-filter="{ row }">
        <span class="font-mono text-xs break-all text-muted">{{ filterText(row) }}</span>
      </template>
      <template #cell-createdAt="{ row }">
        <span class="whitespace-nowrap text-muted">{{
          formatDate(row.createdAt, 'datetime', locale.locale)
        }}</span>
      </template>
    </AdminDataTable>
  </section>
</template>
