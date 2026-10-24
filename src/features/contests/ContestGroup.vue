<script setup lang="ts">
import Chip from '@/components/ui/Chip.vue';
import { computed, watch } from 'vue';
import type { ContestPhase } from '@/api/types/contests';
import Card from '@/components/ui/Card.vue';
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
import { PHASE_PAGE_SIZE, groupQuery, toContestListLocation } from './use-contest-list-filters';
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
const emit = defineEmits<{ page: [page: number] }>();
const locale = useLocaleStore();
const { t } = useI18n();
const query = computed(() => groupQuery(props.filters, props.phase, props.organizationId));
const { data: list, isPending, error, refetch } = useContestListQuery(query);
const contests = computed(() => list.value?.items ?? []);
const total = computed(() => list.value?.meta.total ?? 0);
const isSingleGroup = computed(() => props.filters.phase === props.phase);
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
/** One running contest spans the column; two columns only from two on. */
const isSoleRunning = computed(() => shownContests.value.length === 1);
const hasRunEnded = computed(() => shownContests.value.length < contests.value.length);
/** Then the server is asked once for the list without it. */
watch(hasRunEnded, (isNowEnded) => {
  if (isNowEnded) void refetch();
});
/** The overview shows "5 of 31" when the group lists fewer than it holds. */
const countText = computed(() =>
  !isSingleGroup.value && total.value > contests.value.length
    ? t('contests.list.shownOf', {
        shown: contests.value.length,
        total: formatNumber(total.value, locale.locale),
      })
    : formatNumber(total.value, locale.locale),
);
/** Each overview group names its own way in; the single group offers the way back. */
const linkText = computed(() => {
  if (isSingleGroup.value) return t('contests.list.allGroups');
  if (props.phase === 'running') return t('contests.list.onlyGroup');
  if (props.phase === 'upcoming') return t('contests.list.viewAll');
  return t('contests.list.viewAllCount', { count: formatNumber(total.value, locale.locale) });
});
/** "Only this group" from the overview, "all groups" back from it; the search and rated filter stay. */
const toggleTarget = computed(() => ({
  ...listPage.value,
  query: toContestListLocation({
    ...props.filters,
    phase: isSingleGroup.value ? null : props.phase,
    page: 1,
  }),
}));
const headingId = computed(() => `contest-group-${props.phase}`);
const countId = computed(() => `contest-group-${props.phase}-count`);
/** A page past the last one comes back empty: say so, rather than that the phase has no contests. */
const isPastLastPage = computed(
  () => isSingleGroup.value && props.filters.page > 1 && contests.value.length === 0,
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
  <section :aria-labelledby="headingId" :aria-describedby="countId" class="flex flex-col gap-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-baseline gap-2.5">
        <h2 :id="headingId" class="section-title">
          {{ $t(`contests.phase.${phase}`) }}
        </h2>
        <Chip :id="countId" size="md">{{ countText }}</Chip>
      </div>
      <RouterLink
        :to="toggleTarget"
        class="inline-flex min-h-11 items-center text-accent-text underline"
        >{{ linkText
        }}<span class="sr-only">: {{ $t(`contests.phase.${phase}`) }}</span></RouterLink
      >
    </div>
    <QueryState :loading="isPending" :error="error" @retry="refetch()">
      <template #skeleton><ContestListSkeletons :kind="phase" /></template>
      <ContestListEmpty
        v-if="!shownContests.length"
        :phase="phase"
        :is-filtered="isFiltered"
        :is-past-last-page="isPastLastPage"
        :first-page-target="firstPageTarget"
        :list-route="listPage"
        :tag-name="filters.tag ? (tagName ?? filters.tag) : null"
        :clear-tag-target="clearTagTarget"
      />
      <div
        v-else-if="phase === 'running'"
        :class="['grid gap-4', !isSoleRunning && 'lg:grid-cols-2']"
      >
        <RunningContestCard
          v-for="contest in shownContests"
          :key="contest.key"
          :contest="contest"
          :wide="isSoleRunning"
          :with-edit="Boolean(organizationId)"
        />
      </div>
      <Card v-else-if="phase === 'upcoming'" as="div">
        <ul class="m-0 list-none p-0">
          <UpcomingContestRow
            v-for="contest in shownContests"
            :key="contest.key"
            :contest="contest"
            :with-edit="Boolean(organizationId)"
          />
        </ul>
      </Card>
      <EndedContestTable
        v-else
        :contests="shownContests"
        :is-organization-scoped="Boolean(organizationId)"
      />
      <SubmissionPager
        v-if="isSingleGroup"
        :page="filters.page"
        :page-size="PHASE_PAGE_SIZE"
        :total="list?.meta.total"
        :item-count="contests.length"
        @update:page="(page) => emit('page', page)"
      />
    </QueryState>
  </section>
</template>
