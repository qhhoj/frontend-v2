<script setup lang="ts">
import { computed, watch } from 'vue';
import type { ContestPhase } from '@/api/types/contests';
import PageSection from '@/components/ui/PageSection.vue';
import QueryState from '@/components/QueryState.vue';
import SubmissionPager from '@/features/submissions/SubmissionPager.vue';
import { phaseAt } from '@/lib/contest-time';
import { formatNumber } from '@/lib/format';
import { useNow } from '@/lib/use-now';
import { useLocaleStore } from '@/stores/locale.store';
import { useI18n } from 'vue-i18n';
import { useContestListQuery } from './contests.queries';
import ContestListEmpty from './ContestListEmpty.vue';
import ContestListSkeletons from './ContestListSkeletons.vue';
import EndedContestTable from './EndedContestTable.vue';
import RunningContestCard from './RunningContestCard.vue';
import UpcomingContestRow from './UpcomingContestRow.vue';
import {
  OVERVIEW_PAGE_SIZE,
  PHASE_PAGE_SIZE,
  groupQuery,
  isPagedGroup,
  toContestListLocation,
} from './use-contest-list-filters';
import type { ContestListFilters, ContestListRoute } from './use-contest-list-filters';

const props = defineProps<{
  phase: ContestPhase;
  filters: ContestListFilters;
  /** The filtering tag's display name, for the empty text. */
  tagName?: string | null;
  /** Only this organization's contests (its id); unset on the public list. */
  organizationId?: string;
  /** The page the list lives on, for the links back into it. */
  listRoute?: ContestListRoute;
}>();
const listPage = computed<ContestListRoute>(() => props.listRoute ?? { name: 'contests' });
/** `count` reports the group's total (null while unknown) to the page's toolbar. */
const emit = defineEmits<{ page: [page: number]; count: [total: number | null] }>();
const locale = useLocaleStore();
const { t } = useI18n();
const query = computed(() => groupQuery(props.filters, props.phase, props.organizationId));
const { data: list, isPending, error, refetch } = useContestListQuery(query);
const contests = computed(() => list.value?.items ?? []);
const total = computed(() => list.value?.meta.total ?? 0);
watch(
  () => list.value?.meta.total ?? null,
  (value) => emit('count', value),
  { immediate: true },
);
const isSingleGroup = computed(() => props.filters.phase === props.phase);
const isPaged = computed(() => isPagedGroup(props.filters, props.phase));
const isFiltered = computed(() =>
  Boolean(props.filters.search.trim() || props.filters.isRatedOnly || props.filters.tag),
);
/** A running contest's card counts the seconds: the group follows it to the second, so a card never sits at 00:00:00. */
const now = useNow(props.phase === 'running' ? 1000 : 15_000);
/** A running contest leaves the list the moment its end passes, before the server answers. */
const shownContests = computed(() =>
  contests.value.filter(
    (contest) => props.phase !== 'running' || phaseAt(contest, now.value) === 'running',
  ),
);
const hasRunEnded = computed(() => shownContests.value.length < contests.value.length);
/** Then the server is asked once for the list without it. */
watch(hasRunEnded, (isNowEnded) => {
  if (isNowEnded) void refetch();
});
/** The overview shows "3 of 31" when the group lists fewer than it holds; a paged group shows its total. */
const countText = computed(() =>
  !isPaged.value && total.value > contests.value.length
    ? t('contests.list.shownOf', {
        shown: contests.value.length,
        total: formatNumber(total.value, locale.locale),
      })
    : formatNumber(total.value, locale.locale),
);
/** Each overview group says "Xem tất cả" (its own page of the list); the single group offers the way back.
 * The ended group pages in the overview, so there it has no such link. */
const linkText = computed(() =>
  isSingleGroup.value ? t('contests.list.allGroups') : t('common.viewAll'),
);
/** An empty overview group shows no count and no link: there is nothing to see. */
const hasLink = computed(() => hasItems.value && (isSingleGroup.value || props.phase !== 'ended'));
const hasItems = computed(() => isSingleGroup.value || total.value > 0);
/** An empty running or upcoming group in the overview takes no room: only the groups with contests show. */
const isHidden = computed(
  () =>
    !isSingleGroup.value &&
    props.phase !== 'ended' &&
    !isFiltered.value &&
    !isPending.value &&
    !error.value &&
    shownContests.value.length === 0,
);
/** "Only this group" from the overview, "all groups" back from it; the search and rated filter stay. */
const toggleTarget = computed(() => ({
  ...listPage.value,
  query: toContestListLocation({
    ...props.filters,
    phase: isSingleGroup.value ? null : props.phase,
    page: 1,
  }),
}));
/** A page past the last one comes back empty: say so, rather than that the phase has no contests. */
const isPastLastPage = computed(
  () => isPaged.value && props.filters.page > 1 && contests.value.length === 0,
);
const firstPageTarget = computed(() => ({
  ...listPage.value,
  query: toContestListLocation({ ...props.filters, page: 1 }),
}));
const clearTagTarget = computed(() => ({
  ...listPage.value,
  query: toContestListLocation({ ...props.filters, tag: null, page: 1 }),
}));
</script>

<template>
  <PageSection
    v-if="!isHidden"
    :title="$t(`contests.phase.${phase}`)"
    :count="hasItems ? countText : undefined"
    :see-all="hasLink ? { to: toggleTarget, label: linkText } : undefined"
  >
    <QueryState :loading="isPending" :error="error" @retry="refetch()">
      <template #skeleton><ContestListSkeletons :kind="phase" /></template>
      <ContestListEmpty
        v-if="!shownContests.length"
        :phase="phase"
        :is-filtered="isFiltered"
        :is-past-last-page="isPastLastPage"
        :quiet="!isSingleGroup && !isFiltered"
        :first-page-target="firstPageTarget"
        :list-route="listPage"
        :tag-name="filters.tag ? (tagName ?? filters.tag) : null"
        :clear-tag-target="clearTagTarget"
      />
      <!-- Blocks wrap and grow, so the last row is filled: 1 block is the full width, 2 halves, 4 on a 3-wide row 3 and 1 wide. -->
      <ul v-else-if="phase !== 'ended'" class="m-0 flex list-none flex-wrap gap-3 p-0">
        <component
          :is="phase === 'running' ? RunningContestCard : UpcomingContestRow"
          v-for="contest in shownContests"
          :key="contest.key"
          :contest="contest"
          :with-edit="Boolean(organizationId)"
        />
      </ul>
      <EndedContestTable
        v-else
        :contests="shownContests"
        :is-organization-scoped="Boolean(organizationId)"
      />
      <SubmissionPager
        v-if="isPaged"
        :page="filters.page"
        :page-size="filters.phase === phase ? PHASE_PAGE_SIZE : OVERVIEW_PAGE_SIZE[phase]"
        :total="list?.meta.total"
        :item-count="contests.length"
        @update:page="(page) => emit('page', page)"
      />
    </QueryState>
  </PageSection>
</template>
