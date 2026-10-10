<script setup lang="ts">
import { computed } from 'vue';
import EmptyState from '@/components/EmptyState.vue';
import GlassCard from '@/components/GlassCard.vue';
import QueryState from '@/components/QueryState.vue';
import { useUserPageQuery } from '@/features/users/users.queries';
import { translate } from '@/i18n';
import { formatNumber } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import { useSessionStore } from '@/stores/session.store';
import ProblemFilterChips from './ProblemFilterChips.vue';
import ProblemFilters from './ProblemFilters.vue';
import ProblemTable from './ProblemTable.vue';
import ProblemTableSkeleton from './ProblemTableSkeleton.vue';
import { filterChips } from './problem-filter-chips';
import { useProblemListQuery, useProblemMetaQuery } from './problems.queries';
import { useProblemFilters } from './use-problem-filters';

const { filters, update, clearAll } = useProblemFilters();
const locale = useLocaleStore();
const session = useSessionStore();
const lang = computed(() => locale.locale);
const { data: meta } = useProblemMetaQuery();
const {
  data,
  isPending,
  error,
  refetch,
  hasNextPage,
  fetchNextPage,
  isFetchingNextPage,
  isFetchNextPageError,
  isPlaceholderData,
} = useProblemListQuery(filters, lang);
const { data: viewer } = useUserPageQuery(() => session.user?.username ?? '');
const chips = computed(() =>
  filterChips(filters.value, { types: meta.value?.types ?? [], groups: meta.value?.groups ?? [] }),
);

const problems = computed(() => data.value?.pages.flatMap((result) => result.items) ?? []);
const summary = computed(() => {
  const total = data.value?.pages[0]?.meta.total;
  if (total === undefined) return '';
  const totalText = formatNumber(total, locale.locale);
  return viewer.value
    ? translate(
        'problems.summarySolved',
        { total: totalText, solved: formatNumber(viewer.value.problemCount, locale.locale) },
        total,
      )
    : translate('problems.summary', { total: totalText }, total);
});
</script>

<template>
  <div class="mx-auto flex max-w-7xl flex-col gap-3.5 px-4 py-6 sm:px-8">
    <header class="flex flex-wrap items-baseline gap-x-3">
      <h1 class="font-display text-[26px] font-semibold">{{ $t('problems.title') }}</h1>
      <p class="min-h-6 text-sm text-muted">{{ summary }}</p>
    </header>
    <ProblemFilters
      :filters="filters"
      :types="meta?.types ?? []"
      :groups="meta?.groups ?? []"
      :signed-in="session.user !== null"
      @update="update"
    />
    <ProblemFilterChips :chips="chips" @remove="update" @clear-all="clearAll" />
    <GlassCard as="div" class="overflow-hidden">
      <QueryState
        :loading="isPending"
        :error="isFetchNextPageError ? null : error"
        @retry="refetch()"
      >
        <template #skeleton><ProblemTableSkeleton /></template>
        <EmptyState v-if="!problems.length">{{ $t('problems.empty') }}</EmptyState>
        <ProblemTable
          v-else
          :problems="problems"
          :sort="filters.sort"
          :signed-in="session.user !== null"
          @sort="update({ sort: $event })"
        />
        <div v-if="hasNextPage" class="flex justify-center p-4">
          <button
            type="button"
            :disabled="isFetchingNextPage || isPlaceholderData"
            class="h-12 rounded-pill border border-line bg-surface-strong px-7 font-semibold hover:bg-surface-hover"
            @click="fetchNextPage()"
          >
            {{ $t('problems.loadMore') }}
          </button>
        </div>
      </QueryState>
      <QueryState
        v-if="isFetchNextPageError"
        :loading="false"
        :error="error"
        @retry="fetchNextPage()"
      />
    </GlassCard>
  </div>
</template>
