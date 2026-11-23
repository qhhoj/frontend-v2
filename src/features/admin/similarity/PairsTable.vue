<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { SIMILARITY_PAIRS_PAGE_SIZE } from '@/api/similarity.api';
import type { SimilarityPair } from '@/api/types/similarity';
import EmptyState from '@/components/EmptyState.vue';
import UserLink from '@/components/UserLink.vue';
import AppButton from '@/components/ui/AppButton.vue';
import DataTable from '@/components/ui/DataTable.vue';
import type { DataTableColumn } from '@/components/ui/DataTableColumns';
import ProgressBar from '@/components/ui/ProgressBar.vue';
import { formatNumber } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import { percentText, percentValue } from './similarity-pairs';
import type { PairFilter } from './similarity-pairs';

/**
 * A run's pairs, most similar first: the similarity as a right-aligned number with a meter that repeats it, the two
 * authors, problem, language and the overlap figures. Cards below 768 px.
 */
const props = defineProps<{
  pairs: SimilarityPair[];
  total: number;
  filter: PairFilter;
  /** The first pairs only, shown inside another page: no pager (the host links to the full list). */
  preview?: boolean;
}>();
defineEmits<{ reset: [] }>();
const { t } = useI18n();
const locale = useLocaleStore();
const count = (value: number) => formatNumber(value, locale.locale);

const columns = computed<DataTableColumn[]>(() => [
  { key: 'similarity', label: t('admin.similarity.pairs.columns.similarity'), align: 'end' },
  { key: 'authors', label: t('admin.similarity.pairs.columns.authors'), priority: 'primary' },
  {
    key: 'problemCode',
    label: t('admin.similarity.pairs.columns.problem'),
    cellClass: 'whitespace-nowrap',
  },
  { key: 'language', label: t('admin.similarity.pairs.columns.language') },
  { key: 'longest', label: t('admin.similarity.pairs.columns.longest'), align: 'end' },
  {
    key: 'overlap',
    label: t('admin.similarity.pairs.columns.overlap'),
    align: 'end',
    priority: 'meta',
  },
  {
    key: 'fragments',
    label: t('admin.similarity.pairs.columns.fragments'),
    align: 'end',
    priority: 'meta',
  },
]);
const meta = computed(() => ({
  page: props.filter.page,
  pageSize: SIMILARITY_PAIRS_PAGE_SIZE,
  total: props.total,
}));
const emptyTitle = computed(() =>
  props.filter.minPercent === null
    ? t('admin.similarity.pairs.emptyAny')
    : t('admin.similarity.pairs.emptyAbove', { percent: props.filter.minPercent }),
);
</script>

<template>
  <DataTable
    :variant="preview ? 'ledger' : 'surface'"
    :pager="preview ? undefined : { meta, label: $t('admin.similarity.pairs.pager') }"
    :columns="columns"
    :rows="pairs"
    :row-key="(pair) => pair.id"
    :row-label="(pair) => `${pair.left.username} ↔ ${pair.right.username}`"
    :label="$t('admin.similarity.pairs.title')"
  >
    <template #cell-similarity="{ row }">
      <span class="inline-flex items-center justify-end gap-2">
        <ProgressBar
          aria-hidden="true"
          size="sm"
          tone="neutral"
          class="w-12"
          :value="percentValue(row.similarity)"
          :label="percentText(row.similarity)"
        />
        <span class="font-semibold">{{ percentText(row.similarity) }}</span>
      </span>
    </template>
    <template #cell-authors="{ row }">
      <span class="flex min-w-0 flex-wrap items-center gap-2">
        <UserLink :username="row.left.username" />
        <span aria-hidden="true">↔</span>
        <UserLink :username="row.right.username" />
      </span>
    </template>
    <template #cell-problemCode="{ row }">
      <span class="font-mono">{{ row.problemCode }}</span>
    </template>
    <template #cell-language="{ row }">
      <span class="font-mono">{{ row.language }}</span>
    </template>
    <template #cell-longest="{ row }">{{ count(row.longestFragment) }}</template>
    <template #cell-overlap="{ row }">{{ count(row.totalOverlap) }}</template>
    <template #cell-fragments="{ row }">{{ count(row.fragmentCount) }}</template>
    <template #actions="{ row }">
      <AppButton size="sm" :to="{ name: 'admin-similarityPair', params: { pairId: row.id } }">
        {{ $t('admin.similarity.pairs.open') }}
      </AppButton>
    </template>
    <template #empty>
      <EmptyState compact>
        {{ emptyTitle }} {{ $t('admin.similarity.pairs.emptyHint') }}
        <template #action>
          <AppButton size="sm" @click="$emit('reset')">
            {{ $t('admin.similarity.pairs.resetFilters') }}
          </AppButton>
        </template>
      </EmptyState>
    </template>
  </DataTable>
</template>
