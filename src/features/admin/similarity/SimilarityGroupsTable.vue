<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { formatNumber } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import type { SimilarityGroup } from '@/api/types/similarity';
import AdminDataTable from '../ui/table/AdminDataTable.vue';
import type { AdminColumn } from '../ui/table/table-columns';

/** One row per problem and language family the run compared. Cards below 768 px. */
defineProps<{ groups: SimilarityGroup[] }>();

const { t } = useI18n();
const locale = useLocaleStore();
const count = (value: number) => formatNumber(value, locale.locale);
const yesNo = (flag: boolean) =>
  t(flag ? 'admin.similarity.groups.yes' : 'admin.similarity.groups.no');
const pairsOf = (group: SimilarityGroup) =>
  group.failed ? t('admin.similarity.groups.failed') : count(group.pairCount);
const label = (key: string) => t(`admin.similarity.groups.${key}`);
const columns = computed<AdminColumn[]>(() => [
  { key: 'problemCode', label: label('problem'), priority: 'primary' },
  { key: 'language', label: label('family') },
  { key: 'pairs', label: label('pairs'), align: 'end' },
  { key: 'submissions', label: label('submissions'), align: 'end' },
  { key: 'compared', label: label('compared'), align: 'end' },
  { key: 'skipped', label: label('skipped'), align: 'end', priority: 'meta' },
  { key: 'truncated', label: label('truncated'), priority: 'meta' },
  { key: 'tokenizer', label: label('tokenizer'), priority: 'meta' },
]);
</script>

<template>
  <AdminDataTable
    :columns="columns"
    :rows="groups"
    :row-key="(group) => `${group.problemId}-${group.language}`"
    :label="$t('admin.similarity.groups.label')"
  >
    <template #cell-problemCode="{ row }">
      <span class="font-mono font-semibold">{{ row.problemCode }}</span>
    </template>
    <template #cell-language="{ row }"
      ><span class="font-mono">{{ row.language }}</span></template
    >
    <template #cell-pairs="{ row }">{{ pairsOf(row) }}</template>
    <template #cell-submissions="{ row }">{{ count(row.submissionCount) }}</template>
    <template #cell-compared="{ row }">{{ count(row.comparedCount) }}</template>
    <template #cell-skipped="{ row }">
      {{ count(row.skippedEmpty) }} / {{ count(row.skippedTooLarge) }}
    </template>
    <template #cell-truncated="{ row }">{{ yesNo(row.truncated) }}</template>
    <template #cell-tokenizer="{ row }">{{ row.tokenizer }}</template>
  </AdminDataTable>
</template>
