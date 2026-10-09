<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import EmptyState from '@/components/EmptyState.vue';
import NumberedPager from '@/components/NumberedPager.vue';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import { valuesOf } from '@/features/problems/use-problem-filters';
import { formatDateTime, formatNumber } from '@/lib/format';
import { pageFromQuery } from '@/lib/paging';
import { useLocaleStore } from '@/stores/locale.store';
import { ADMIN_BUTTON_CLASS } from '../ui/classes';
import HighlightedText from './HighlightedText.vue';
import IndexSearchBox from './IndexSearchBox.vue';
import { CONTEST_PHASE_FILTERS, phaseFromQuery, searchQueryOf } from './index-search';
import type { ContestPhaseFilter } from './index-search';
import { useAdminContestSearchQuery } from './index-search.queries';

const route = useRoute();
const router = useRouter();
const locale = useLocaleStore();
const search = computed(() => (valuesOf(route.query.q)[0] ?? '').slice(0, 100));
const phase = computed(() => phaseFromQuery(route.query.phase));
const page = computed(() => pageFromQuery(route.query.page));
const { data, isPending, error, refetch } = useAdminContestSearchQuery(search, phase, page);
const commit = (text: string) =>
  void router.replace({ query: searchQueryOf(route.query, { q: text }) });

const isActivePhase = (filter: ContestPhaseFilter) => (phase.value ?? 'all') === filter;
const phaseLink = (filter: ContestPhaseFilter) => ({
  query: searchQueryOf(route.query, { phase: filter }),
});
const shownText = computed(() => formatNumber(data.value?.items.length ?? 0, locale.locale));
const totalText = computed(() => formatNumber(data.value?.meta.total ?? 0, locale.locale));
</script>

<template>
  <section
    class="glass flex min-w-0 flex-col gap-4 rounded-panel p-5"
    aria-labelledby="contest-search-title"
  >
    <h2 id="contest-search-title" class="font-display text-xl font-semibold">
      {{ $t('admin.search.contests.title') }}
    </h2>
    <IndexSearchBox
      :value="search"
      :label="$t('admin.search.contests.label')"
      :placeholder="$t('admin.search.contests.placeholder')"
      :clear-label="$t('admin.search.clear')"
      :hint="$t('admin.search.contests.hint')"
      @commit="commit"
    />
    <nav
      :aria-label="$t('admin.search.contests.phaseLabel')"
      class="flex flex-wrap gap-1 self-start rounded-pill border border-line-strong bg-surface-solid p-1"
    >
      <RouterLink
        v-for="filter in CONTEST_PHASE_FILTERS"
        :key="filter"
        :to="phaseLink(filter)"
        :aria-current="isActivePhase(filter) ? 'true' : undefined"
        class="inline-flex min-h-11 items-center rounded-pill px-4 text-sm font-semibold text-muted hover:text-content aria-[current=true]:bg-accent-soft aria-[current=true]:text-accent-soft-text"
        >{{
          filter === 'all' ? $t('admin.search.contests.all') : $t(`contests.phase.${filter}`)
        }}</RouterLink
      >
    </nav>
    <QueryState :loading="isPending" :error="error" @retry="refetch()">
      <template #skeleton>
        <SkeletonBlock
          data-skeleton-region="contest-search-table"
          class="h-64 w-full rounded-row"
        />
      </template>
      <EmptyState v-if="data && data.items.length === 0" compact>
        <strong>
          {{
            search
              ? $t('admin.search.contests.emptyFor', { q: search })
              : $t('admin.search.contests.empty')
          }}
        </strong>
        <span>{{ $t('admin.search.contests.emptyAdvice') }}</span>
      </EmptyState>
      <div v-else-if="data" class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <caption class="sr-only">
            {{
              $t('admin.search.contests.title')
            }}
          </caption>
          <thead class="text-xs text-muted uppercase">
            <tr>
              <th scope="col" class="px-3 py-2">
                {{ $t('admin.search.contests.columns.contest') }}
              </th>
              <th scope="col" class="px-3 py-2">{{ $t('admin.search.contests.columns.time') }}</th>
              <th scope="col" class="px-3 py-2">{{ $t('admin.search.contests.columns.phase') }}</th>
              <th scope="col" class="px-3 py-2">{{ $t('admin.search.contests.columns.users') }}</th>
              <th scope="col" class="px-3 py-2">
                <span class="sr-only">{{ $t('admin.search.edit') }}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="contest in data.items" :key="contest.key" class="border-t border-line">
              <td class="px-3 py-3">
                <RouterLink
                  :to="{ name: 'admin-contestGeneral', params: { key: contest.key } }"
                  class="font-semibold text-accent hover:underline"
                >
                  <HighlightedText :text="contest.name" :query="search" />
                </RouterLink>
                <div class="font-mono text-xs text-muted">
                  <HighlightedText :text="contest.key" :query="search" />
                </div>
              </td>
              <td class="px-3 py-3 text-sm">
                {{ formatDateTime(contest.startTime, locale.locale) }} –
                {{ formatDateTime(contest.endTime, locale.locale) }}
                <span v-if="contest.isRated"> · {{ $t('admin.search.contests.rated') }}</span>
              </td>
              <td class="px-3 py-3">{{ $t(`contests.phase.${contest.phase}`) }}</td>
              <td class="px-3 py-3 font-mono">
                {{ formatNumber(contest.userCount, locale.locale) }}
              </td>
              <td class="px-3 py-3 text-right">
                <RouterLink
                  :to="{ name: 'admin-contestGeneral', params: { key: contest.key } }"
                  :class="ADMIN_BUTTON_CLASS"
                  >{{ $t('admin.search.edit') }}</RouterLink
                >
              </td>
            </tr>
          </tbody>
        </table>
        <div class="flex flex-wrap items-center justify-between gap-3 pt-3">
          <p class="text-sm text-muted">
            {{
              search
                ? $t('admin.search.contests.countFor', {
                    shown: shownText,
                    total: totalText,
                    q: search,
                  })
                : $t('admin.search.contests.count', { shown: shownText, total: totalText })
            }}
          </p>
          <NumberedPager :meta="data.meta" :label="$t('admin.search.pager')" />
        </div>
      </div>
    </QueryState>
  </section>
</template>
