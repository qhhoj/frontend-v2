<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import CreateShortcut from '@/features/admin/creation/CreateShortcut.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import PageLayout from '@/components/ui/PageLayout.vue';
import { useUserPageQuery } from '@/features/users/users.queries';
import { translate } from '@/i18n';
import { formatNumber } from '@/lib/format';
import { lastPageOf } from '@/lib/paging';
import { useLocaleStore } from '@/stores/locale.store';
import { useSessionStore } from '@/stores/session.store';
import ProblemFilterChips from './ProblemFilterChips.vue';
import ProblemFilters from './ProblemFilters.vue';
import ProblemTable from './ProblemTable.vue';
import { filterChips } from './problem-filter-chips';
import { saveListSetup } from './problem-list-setup';
import { useProblemListQuery, useProblemMetaQuery, usePrefetchProblem } from './problems.queries';
import { NO_FILTERS, useProblemFilters } from './use-problem-filters';
import type { ProblemFilters as Filters } from './use-problem-filters';

/**
 * The problem list on `PageLayout`: the header (with the staff's "Tạo bài tập"), one `Toolbar` (search and filters left;
 * count, phone sort and random pick right) with the active filter chips under it, then the table.
 */
const router = useRouter();
const { filters: urlFilters, page, update, clearAll } = useProblemFilters();
const locale = useLocaleStore();
const session = useSessionStore();
const lang = computed(() => locale.locale);
/** A signed-out viewer has no solved choice to see or change, so a `?unsolved=1` link must not narrow their list unseen. */
const filters = computed<Filters>(() =>
  session.user ? urlFilters.value : { ...urlFilters.value, solved: 'any' },
);
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
/** The solved choice has no chip, but an empty list under it still offers to clear the filters. */
const isFiltered = computed(() => chips.value.length > 0 || filters.value.solved !== 'any');

const problems = computed(() => data.value?.items ?? []);
const listedCodes = computed(() => problems.value.map((problem) => problem.code));

/** The solved choice and the sort are the learner's setup: kept for the next bare visit (`problem-list-setup.ts`). */
function change(patch: Partial<Filters>) {
  update(patch);
  const username = session.user?.username;
  if (!username || !('solved' in patch || 'sort' in patch)) return;
  saveListSetup(username, { ...filters.value, ...patch });
}
/** The empty state's "Xóa bộ lọc": everything but the sort, the solved choice included (it may be what emptied the list). */
const clearFilters = () => {
  clearAll();
  const username = session.user?.username;
  if (username) saveListSetup(username, { solved: 'any', sort: filters.value.sort });
};
/** The chip row's "Xóa tất cả" clears what the chips show: the solved choice has no chip, so it stays, like the sort. */
const clearChips = () =>
  update({ ...NO_FILTERS, solved: filters.value.solved, sort: filters.value.sort });

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

/** "214 đã giải · 1.483 bài", or "3 kết quả" under filters; the solved part for a signed-in viewer only. */
const countText = computed(() => {
  const total = data.value?.meta.total;
  if (total === undefined) return '';
  const count = formatNumber(total, locale.locale);
  const listed = isFiltered.value
    ? translate('problems.results', { n: count }, total)
    : translate('problems.count', { n: count }, total);
  if (!viewer.value) return listed;
  const solved = formatNumber(viewer.value.problemCount, locale.locale);
  return `${translate('problems.solvedShort', { solved })} · ${listed}`;
});

const prefetch = usePrefetchProblem(lang);
/** The row an event came from has its problem loaded ahead. */
function prefetchRow(event: Event) {
  const row =
    event.target instanceof Element ? event.target.closest<HTMLElement>('tr[data-code]') : null;
  if (row?.dataset.code) prefetch(row.dataset.code);
}
</script>

<template>
  <PageLayout>
    <template #header>
      <PageHeader :title="$t('problems.title')">
        <template #actions><CreateShortcut kind="problem" /></template>
      </PageHeader>
    </template>
    <template #toolbar>
      <ProblemFilters
        :filters="filters"
        :types="meta?.types ?? []"
        :groups="meta?.groups ?? []"
        :signed-in="session.user !== null"
        :listed-codes="listedCodes"
        :count-text="countText"
        @update="change"
      >
        <template v-if="chips.length" #default>
          <ProblemFilterChips :chips="chips" @remove="update" @clear-all="clearChips" />
        </template>
      </ProblemFilters>
    </template>
    <!-- eslint-disable-next-line vuejs-accessibility/no-static-element-interactions -- the rows' links take focus and clicks; this only listens to them bubble. -->
    <div
      ref="listTop"
      class="min-w-0 scroll-mt-20"
      :aria-busy="isPlaceholderData"
      @pointerover="prefetchRow"
      @focusin="prefetchRow"
    >
      <ProblemTable
        :problems="problems"
        :sort="filters.sort"
        :signed-in="session.user !== null"
        :loading="isPending"
        :error="error"
        :meta="data?.meta"
        :filtered="isFiltered"
        @sort="change({ sort: $event })"
        @retry="refetch()"
        @clear-filters="clearFilters"
      />
    </div>
  </PageLayout>
</template>
