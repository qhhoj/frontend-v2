<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import EmptyState from '@/components/EmptyState.vue';
import CreateShortcut from '@/features/admin/creation/CreateShortcut.vue';
import Card from '@/components/ui/Card.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import NumberedPager from '@/components/NumberedPager.vue';
import QueryState from '@/components/QueryState.vue';
import { useUserPageQuery } from '@/features/users/users.queries';
import { translate } from '@/i18n';
import { formatNumber, formatProblemPoints } from '@/lib/format';
import { lastPageOf } from '@/lib/paging';
import { PHONE_QUERY, useMediaQuery } from '@/lib/use-media-query';
import { useLocaleStore } from '@/stores/locale.store';
import { useSessionStore } from '@/stores/session.store';
import ProblemFilterChips from './ProblemFilterChips.vue';
import ProblemFilters from './ProblemFilters.vue';
import ProblemStatusMark from './ProblemStatusMark.vue';
import ProblemTable from './ProblemTable.vue';
import ProblemTableSkeleton from './ProblemTableSkeleton.vue';
import { filterChips } from './problem-filter-chips';
import { useProblemListQuery, useProblemMetaQuery } from './problems.queries';
import { useProblemFilters } from './use-problem-filters';

const router = useRouter();
const { filters, page, update, clearAll } = useProblemFilters();
const locale = useLocaleStore();
const session = useSessionStore();
const lang = computed(() => locale.locale);
const { data: meta } = useProblemMetaQuery();
const { data, isPending, error, refetch, isPlaceholderData } = useProblemListQuery(
  filters,
  lang,
  page,
);
const { data: viewer } = useUserPageQuery(() => session.user?.username ?? '');
const chips = computed(() =>
  filterChips(filters.value, { types: meta.value?.types ?? [], groups: meta.value?.groups ?? [] }),
);

const problems = computed(() => data.value?.items ?? []);

/** A page past the end (a stale link, a shrunk list) or an unusable `?page=` is replaced by the nearest valid one. */
watch([data, isPlaceholderData, () => router.currentRoute.value.query.page], () => {
  if (!data.value || isPlaceholderData.value) return;
  const target = Math.min(page.value, lastPageOf(data.value.meta));
  const { page: raw, ...kept } = router.currentRoute.value.query;
  const canonical = target === 1 ? undefined : String(target);
  if (raw !== canonical)
    void router.replace({ query: canonical ? { ...kept, page: canonical } : kept });
});

/** Another page is a new list: bring its top (not the rail's) into view, below the shell's header. */
const listTop = ref<HTMLElement | null>(null);
watch(page, () => listTop.value?.scrollIntoView({ block: 'start' }), { flush: 'post' });

/** The signed-in viewer's progress; anonymous visitors get nothing. */
const solvedSummary = computed(() =>
  viewer.value
    ? translate('problems.solvedCount', {
        solved: formatNumber(viewer.value.problemCount, locale.locale),
      })
    : '',
);
/** Above the list: how many problems, or how many match the filters. */
const countText = computed(() => {
  const total = data.value?.meta.total;
  if (total === undefined) return '';
  const count = formatNumber(total, locale.locale);
  return chips.value.length
    ? translate('problems.results', { n: count }, total)
    : translate('problems.count', { n: count }, total);
});
/** The legend: desktop only, so a phone keeps the list on its first screen; status marks only mean something to a signed-in viewer. */
const partialSample = computed(() => formatProblemPoints(800, true, locale.locale));
const isPhone = useMediaQuery(PHONE_QUERY);
const LEGEND_MARKS = [
  { status: 'solved', labelKey: 'problems.solved' },
  { status: 'attempted', labelKey: 'problems.attempted' },
  { status: null, labelKey: 'problems.notTried' },
] as const;
</script>

<template>
  <div class="page-column">
    <PageHeader :title="$t('problems.title')" :meta="solvedSummary ? [solvedSummary] : []">
      <template v-if="solvedSummary || !isPhone" #meta>
        <p
          data-testid="problems-legend"
          class="hidden flex-wrap items-center gap-x-2 gap-y-1 md:flex"
        >
          <template v-if="session.user !== null">
            <span v-if="solvedSummary" aria-hidden="true">·</span>
            <template v-for="(mark, index) in LEGEND_MARKS" :key="mark.labelKey">
              <span v-if="index > 0" aria-hidden="true">·</span>
              <span class="inline-flex items-center gap-1 lowercase">
                <span aria-hidden="true" class="inline-flex"
                  ><ProblemStatusMark :status="mark.status" class="size-3.5"
                /></span>
                {{ $t(mark.labelKey) }}
              </span>
            </template>
            <span aria-hidden="true">·</span>
          </template>
          <span
            ><b class="font-mono font-semibold text-content">{{ partialSample }}</b>
            {{ $t('problems.legendPartial') }}</span
          >
        </p>
      </template>
      <template #actions><CreateShortcut kind="problem" /></template>
    </PageHeader>
    <ProblemFilters
      :filters="filters"
      :types="meta?.types ?? []"
      :groups="meta?.groups ?? []"
      :signed-in="session.user !== null"
      @update="update"
    />
    <ProblemFilterChips :chips="chips" @remove="update" @clear-all="clearAll" />
    <div ref="listTop" class="flex scroll-mt-20 flex-col gap-3" :aria-busy="isPlaceholderData">
      <div v-if="data" class="flex min-h-11 flex-wrap items-center justify-between gap-2">
        <p data-testid="problems-count" class="text-sm text-muted">{{ countText }}</p>
        <!-- A phone keeps the count, search, sort and "Bộ lọc" above the rows; its pager is the one under them (M-18). -->
        <NumberedPager
          stepper
          align="end"
          class="max-sm:hidden"
          :meta="data.meta"
          :label="$t('problems.pagerTop')"
        />
      </div>
      <Card as="div" class="overflow-hidden">
        <QueryState :loading="isPending" :error="error" @retry="refetch()">
          <template #skeleton><ProblemTableSkeleton /></template>
          <EmptyState v-if="!problems.length">{{ $t('problems.empty') }}</EmptyState>
          <ProblemTable
            v-else
            :problems="problems"
            :sort="filters.sort"
            :signed-in="session.user !== null"
            @sort="update({ sort: $event })"
          />
          <NumberedPager v-if="data" class="p-4" :meta="data.meta" :label="$t('problems.pager')" />
        </QueryState>
      </Card>
    </div>
  </div>
</template>
