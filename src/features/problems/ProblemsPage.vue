<script setup lang="ts">
import { computed } from 'vue';
import GlassCard from '@/components/GlassCard.vue';
import QueryState from '@/components/QueryState.vue';
import { useUserPageQuery } from '@/features/users/users.queries';
import { translate } from '@/i18n';
import { formatNumber } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import { useSessionStore } from '@/stores/session.store';
import ProblemFilters from './ProblemFilters.vue';
import ProblemTable from './ProblemTable.vue';
import ProblemTableSkeleton from './ProblemTableSkeleton.vue';
import { useProblemListQuery, useProblemMetaQuery } from './problems.queries';
import { useProblemFilters } from './use-problem-filters';

const { filters, update } = useProblemFilters();
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
  <div class="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-6 sm:px-8">
    <header class="pt-3 pb-1 text-center">
      <h1 class="font-display text-4xl font-bold tracking-tight sm:text-[44px]">
        {{ $t('problems.title') }}
      </h1>
      <p class="mt-2 min-h-6 text-muted">{{ summary }}</p>
    </header>
    <ProblemFilters :filters="filters" :types="meta?.types ?? []" @update="update" />
    <GlassCard as="div" class="overflow-hidden">
      <QueryState
        :loading="isPending"
        :error="isFetchNextPageError ? null : error"
        @retry="refetch()"
      >
        <template #skeleton><ProblemTableSkeleton /></template>
        <p v-if="!problems.length" class="py-10 text-center text-muted">
          {{ $t('problems.empty') }}
        </p>
        <ProblemTable
          v-else
          :problems="problems"
          :sort="filters.sort"
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
