<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { OfficialRanking } from '@/api/types/contest-editing';
import DataTable from '@/components/ui/DataTable.vue';
import type { DataTableColumn } from '@/components/ui/DataTableColumns';

/** The top three rows of the stored official ranking: a ranking board, so rank and username stay pinned on phones. */
const props = defineProps<{ ranking: OfficialRanking }>();
const { t } = useI18n();
const PREVIEW_ROWS = 3;
const scoreKey = (index: number) => `score${index}`;
const rows = computed(() =>
  props.ranking.rows.slice(0, PREVIEW_ROWS).map((row) => ({
    ...row,
    ...Object.fromEntries(row.scores.map((score, index) => [scoreKey(index), score])),
  })),
);
const columns = computed<DataTableColumn[]>(() => [
  { key: 'rank', label: t('admin.contests.ranking.official.columns.rank'), align: 'end' },
  {
    key: 'username',
    label: t('admin.contests.ranking.official.columns.username'),
    cellClass: 'font-mono',
  },
  { key: 'fullName', label: t('admin.contests.ranking.official.columns.fullName'), grow: true },
  ...props.ranking.problems.map((problem, index) => ({
    key: scoreKey(index),
    label: problem,
    align: 'end' as const,
  })),
  {
    key: 'totalScore',
    label: t('admin.contests.ranking.official.columns.total'),
    align: 'end',
    cellClass: 'font-semibold',
  },
]);
</script>

<template>
  <DataTable
    data-testid="official-table"
    :columns="columns"
    :rows="rows"
    :row-key="(row) => row.username"
    :label="$t('admin.contests.ranking.official.current', { count: ranking.problems.length })"
    density="compact"
    stack="scroll"
    :sticky-columns="2"
  />
</template>
