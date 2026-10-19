<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { RunStatus, SimilarityRun, SimilarityScope } from '@/api/types/similarity';
import { formatNumber } from '@/lib/format';
import { formatDate } from '@/lib/format-date';
import { useLocaleStore } from '@/stores/locale.store';
import AdminChip from '../ui/AdminChip.vue';
import type { ChipTone } from '../ui/AdminChip.vue';
import { buttonClass } from '../ui/controls';
import { shortId } from '../ui/short-id';
import AdminDataTable from '../ui/table/AdminDataTable.vue';
import type { AdminColumn } from '../ui/table/table-columns';
import { runDurationText, runStatusText } from './run-text';
import { scopeQuery, totalPairs } from './similarity-runs';

/** The scope's runs, newest first, each linking to its summary. Cards below 768 px. */
const props = defineProps<{ runs: SimilarityRun[]; scope: SimilarityScope }>();
const { t } = useI18n();
const locale = useLocaleStore();

const columns = computed<AdminColumn[]>(() => [
  { key: 'id', label: t('admin.similarity.runs.columns.id'), priority: 'primary' },
  { key: 'status', label: t('admin.similarity.runs.columns.status'), priority: 'badge' },
  { key: 'createdAt', label: t('admin.similarity.runs.columns.createdAt') },
  { key: 'duration', label: t('admin.similarity.runs.columns.duration') },
  { key: 'groups', label: t('admin.similarity.runs.columns.groups'), align: 'end' },
  { key: 'pairs', label: t('admin.similarity.runs.columns.pairs'), align: 'end' },
]);
const TONES: Record<RunStatus, ChipTone> = {
  queued: 'neutral',
  running: 'info',
  done: 'positive',
  failed: 'negative',
};
const pairsText = (run: SimilarityRun) => {
  const pairs = totalPairs(run);
  return pairs === null ? '—' : formatNumber(pairs, locale.locale);
};
const detailTo = (run: SimilarityRun) => ({
  name: 'admin-similarity',
  query: { ...scopeQuery(props.scope), run: run.id },
});
</script>

<template>
  <section class="flex flex-col gap-3">
    <h2 class="font-display text-base font-semibold">
      {{
        'problem' in scope
          ? $t('admin.similarity.runs.ofProblem', { code: scope.problem })
          : $t('admin.similarity.runs.ofContest', { key: scope.contest })
      }}
    </h2>
    <AdminDataTable
      data-testid="runs"
      :columns="columns"
      :rows="runs"
      :row-key="(run) => run.id"
      :row-label="(run) => shortId(run.id)"
      :label="$t('admin.similarity.runs.label')"
      :empty-text="$t('admin.similarity.runs.empty')"
    >
      <template #cell-id="{ row }">
        <span class="font-mono font-semibold">{{ shortId(row.id) }}</span>
      </template>
      <template #cell-status="{ row }">
        <AdminChip :tone="TONES[row.status]">{{ runStatusText(row) }}</AdminChip>
      </template>
      <template #cell-createdAt="{ row }">
        <span class="whitespace-nowrap">{{
          formatDate(row.createdAt, 'datetime', locale.locale)
        }}</span>
      </template>
      <template #cell-duration="{ row }">{{ runDurationText(row) }}</template>
      <template #cell-groups="{ row }">{{ row.groups.length }}</template>
      <template #cell-pairs="{ row }">{{ pairsText(row) }}</template>
      <template #actions="{ row }">
        <RouterLink :to="detailTo(row)" :class="buttonClass('secondary', 'sm')">
          {{ $t('admin.similarity.runs.detail') }}
        </RouterLink>
      </template>
    </AdminDataTable>
  </section>
</template>
