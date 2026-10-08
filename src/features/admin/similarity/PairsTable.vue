<script setup lang="ts">
import { computed } from 'vue';
import { translate } from '@/i18n';
import EmptyState from '@/components/EmptyState.vue';
import { SIMILARITY_PAIRS_PAGE_SIZE } from '@/api/similarity.api';
import { formatNumber } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import type { SimilarityPair } from '@/api/types/similarity';
import AdminUserLabel from '../ui/AdminUserLabel.vue';
import { ADMIN_BUTTON_CLASS } from '../ui/classes';
import { pairFilterQuery, percentText } from './similarity-pairs';
import type { PairFilter } from './similarity-pairs';

const props = defineProps<{
  runId: string;
  pairs: SimilarityPair[];
  total: number;
  filter: PairFilter;
}>();
defineEmits<{ reset: [] }>();

const locale = useLocaleStore();
const count = (value: number) => formatNumber(value, locale.locale);
const lastPage = computed(() => Math.max(1, Math.ceil(props.total / SIMILARITY_PAIRS_PAGE_SIZE)));
const firstShown = computed(() => (props.filter.page - 1) * SIMILARITY_PAIRS_PAGE_SIZE + 1);
const lastShown = computed(() =>
  Math.min(props.filter.page * SIMILARITY_PAIRS_PAGE_SIZE, props.total),
);

const countLine = computed(() =>
  props.filter.minPercent === null
    ? translate('admin.similarity.pairs.count', { count: count(props.total) })
    : translate('admin.similarity.pairs.countAbove', {
        count: count(props.total),
        percent: props.filter.minPercent,
      }),
);
const emptyTitle = computed(() =>
  props.filter.minPercent === null
    ? translate('admin.similarity.pairs.emptyAny')
    : translate('admin.similarity.pairs.emptyAbove', { percent: props.filter.minPercent }),
);
const pageTo = (page: number) => ({
  name: 'admin-similarityPairs',
  params: { runId: props.runId },
  query: pairFilterQuery({ ...props.filter, page }),
});
</script>

<template>
  <section class="flex flex-col gap-3">
    <div class="flex flex-wrap items-baseline justify-between gap-2">
      <p class="font-semibold">{{ countLine }}</p>
      <p class="text-sm text-muted">{{ $t('admin.similarity.pairs.sortNote') }}</p>
    </div>
    <EmptyState v-if="pairs.length === 0">
      <span class="block">{{ emptyTitle }}</span>
      <span class="block">{{ $t('admin.similarity.pairs.emptyHint') }}</span>
      <button type="button" class="mt-3" :class="ADMIN_BUTTON_CLASS" @click="$emit('reset')">
        {{ $t('admin.similarity.pairs.filters.reset') }}
      </button>
    </EmptyState>
    <ul v-else class="flex flex-col gap-2">
      <li
        v-for="pair in pairs"
        :key="pair.id"
        class="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-panel border border-line p-3"
      >
        <span class="font-display text-xl font-bold">{{ percentText(pair.similarity) }}</span>
        <span class="flex min-w-0 flex-wrap items-center gap-2">
          <AdminUserLabel :username="pair.left.username" />
          <span aria-hidden="true">↔</span>
          <AdminUserLabel :username="pair.right.username" />
        </span>
        <span class="font-mono text-sm">{{ pair.problemCode }}</span>
        <span class="font-mono text-sm">{{ pair.language }}</span>
        <span class="text-sm">
          <span class="text-muted">{{ $t('admin.similarity.pairs.columns.longest') }}</span>
          {{ count(pair.longestFragment) }}
        </span>
        <span class="text-sm">
          <span class="text-muted">{{ $t('admin.similarity.pairs.columns.overlap') }}</span>
          {{ count(pair.totalOverlap) }}
        </span>
        <span class="text-sm">
          <span class="text-muted">{{ $t('admin.similarity.pairs.columns.fragments') }}</span>
          {{ count(pair.fragmentCount) }}
        </span>
        <RouterLink
          :to="{ name: 'admin-similarityPair', params: { pairId: pair.id } }"
          class="inline-flex min-h-11 items-center font-semibold underline sm:ms-auto"
        >
          {{ $t('admin.similarity.pairs.open') }}
        </RouterLink>
      </li>
    </ul>
    <nav
      v-if="lastPage > 1"
      class="flex flex-wrap items-center justify-between gap-3 text-sm"
      :aria-label="$t('admin.similarity.pairs.pager')"
    >
      <p>
        {{
          $t('admin.similarity.pairs.showing', {
            from: count(firstShown),
            to: count(lastShown),
            total: count(total),
          })
        }}
      </p>
      <div class="flex gap-2">
        <RouterLink
          v-if="filter.page > 1"
          :to="pageTo(filter.page - 1)"
          class="inline-flex min-h-11 items-center rounded-pill border border-line px-4 font-semibold"
        >
          {{ $t('admin.similarity.pairs.previous') }}
        </RouterLink>
        <RouterLink
          v-if="filter.page < lastPage"
          :to="pageTo(filter.page + 1)"
          class="inline-flex min-h-11 items-center rounded-pill border border-line px-4 font-semibold"
        >
          {{ $t('admin.similarity.pairs.next') }}
        </RouterLink>
      </div>
    </nav>
  </section>
</template>
