<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { RunStatus, SimilarityRun, SimilarityScope } from '@/api/types/similarity';
import { formatNumber } from '@/lib/format';
import { formatDate } from '@/lib/format-date';
import { useLocaleStore } from '@/stores/locale.store';
import AppButton from '@/components/ui/AppButton.vue';
import Chip from '@/components/ui/Chip.vue';
import type { ChipTone } from '@/components/ui/Chip.vue';
import DataTable from '@/components/ui/DataTable.vue';
import type { DataTableColumn } from '@/components/ui/DataTableColumns';
import { shortId } from '../ui/short-id';
import { runDurationText, runStatusText } from './run-text';
import { scopeQuery, totalPairs } from './similarity-runs';

/**
 * The scope's runs, newest first, each linking to its summary. Cards below 768 px. With `inPlace` the table sits inside
 * another page (the contest workbench): no heading of its own, and a finished run's action asks the host to show its
 * pairs there (`open`; `openId` is the run whose pairs are shown) instead of leaving for the summary page.
 */
const props = defineProps<{
  runs: SimilarityRun[];
  scope: SimilarityScope;
  inPlace?: boolean;
  openId?: string | null;
}>();
defineEmits<{ open: [runId: string] }>();
const { t } = useI18n();
const locale = useLocaleStore();

const columns = computed<DataTableColumn[]>(() => [
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
  done: 'success',
  failed: 'danger',
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
    <h2 v-if="!inPlace" class="font-display text-base font-semibold">
      {{
        'problem' in scope
          ? $t('admin.similarity.runs.ofProblem', { code: scope.problem })
          : $t('admin.similarity.runs.ofContest', { key: scope.contest })
      }}
    </h2>
    <DataTable
      data-testid="runs"
      :variant="inPlace ? 'ledger' : 'surface'"
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
        <Chip :tone="TONES[row.status]">{{ runStatusText(row) }}</Chip>
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
        <AppButton
          v-if="inPlace && row.status === 'done'"
          size="sm"
          data-testid="run-pairs"
          :aria-expanded="openId === row.id"
          @click="$emit('open', row.id)"
        >
          {{ $t(`admin.similarity.runs.${openId === row.id ? 'hidePairs' : 'showPairs'}`) }}
        </AppButton>
        <AppButton v-else size="sm" :to="detailTo(row)">
          {{ $t('admin.similarity.runs.detail') }}
        </AppButton>
      </template>
    </DataTable>
  </section>
</template>
