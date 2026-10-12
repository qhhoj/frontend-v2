<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { SIMILARITY_PAIRS_PAGE_SIZE } from '@/api/similarity.api';
import type { SimilarityPair } from '@/api/types/similarity';
import { formatNumber } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import AdminUserLabel from '../ui/AdminUserLabel.vue';
import { buttonClass } from '../ui/controls';
import AdminDataTable from '../ui/table/AdminDataTable.vue';
import type { AdminColumn } from '../ui/table/table-columns';
import { percentText } from './similarity-pairs';
import type { PairFilter } from './similarity-pairs';

/**
 * A run's pairs, most similar first: the similarity as a right-aligned number with a meter that repeats it, the two
 * authors, problem, language and the overlap figures. Cards below 768 px.
 */
const props = defineProps<{ pairs: SimilarityPair[]; total: number; filter: PairFilter }>();
defineEmits<{ reset: [] }>();
const { t } = useI18n();
const locale = useLocaleStore();
const count = (value: number) => formatNumber(value, locale.locale);

const columns = computed<AdminColumn[]>(() => [
  { key: 'similarity', label: t('admin.similarity.pairs.columns.similarity'), align: 'end' },
  { key: 'authors', label: t('admin.similarity.pairs.columns.authors'), priority: 'primary' },
  { key: 'problemCode', label: t('admin.similarity.pairs.columns.problem') },
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
  <AdminDataTable
    :pager="meta ? { meta, label: $t('admin.similarity.pairs.pager') } : undefined"
    :columns="columns"
    :rows="pairs"
    :row-key="(pair) => pair.id"
    :row-label="(pair) => `${pair.left.username} ↔ ${pair.right.username}`"
    :label="$t('admin.similarity.pairs.title')"
  >
    <template #cell-similarity="{ row }">
      <span class="inline-flex items-center justify-end gap-2">
        <span aria-hidden="true" class="h-1.5 w-12 rounded-pill bg-surface-strong">
          <span
            class="block h-full rounded-pill bg-accent"
            :style="{ width: percentText(row.similarity) }"
          />
        </span>
        <span class="font-semibold">{{ percentText(row.similarity) }}</span>
      </span>
    </template>
    <template #cell-authors="{ row }">
      <span class="flex min-w-0 flex-wrap items-center gap-2">
        <AdminUserLabel :username="row.left.username" />
        <span aria-hidden="true">↔</span>
        <AdminUserLabel :username="row.right.username" />
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
      <RouterLink
        :to="{ name: 'admin-similarityPair', params: { pairId: row.id } }"
        :class="buttonClass('secondary', 'sm')"
      >
        {{ $t('admin.similarity.pairs.open') }}
      </RouterLink>
    </template>
    <template #empty>
      <div class="flex flex-col items-center gap-2 px-4 py-8 text-center">
        <p class="m-0 font-semibold">{{ emptyTitle }}</p>
        <p class="m-0 text-sm text-muted">{{ $t('admin.similarity.pairs.emptyHint') }}</p>
        <button type="button" :class="buttonClass('secondary', 'sm')" @click="$emit('reset')">
          {{ $t('admin.similarity.pairs.resetFilters') }}
        </button>
      </div>
    </template>
  </AdminDataTable>
</template>
