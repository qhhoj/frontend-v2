<script setup lang="ts">
import { computed, ref, toRef, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ApiError } from '@/api/client';
import QueryState from '@/components/QueryState.vue';
import ContestProblemSwitcher from '@/features/contests/ContestProblemSwitcher.vue';
import { useProblemRail } from '@/features/contests/use-problem-rail';
import { useProblemRailCollapse } from '@/features/contests/use-problem-rail-collapse';
import NotFoundPage from '@/features/not-found/NotFoundPage.vue';
import { useNavSection } from '@/features/shell/nav-section';
import { translate } from '@/i18n';
import { usePageTitle } from '@/router/page-title';
import { useLocaleStore } from '@/stores/locale.store';
import { useSessionStore } from '@/stores/session.store';
import ProblemContent from './ProblemContent.vue';
import StatementSkeleton from './StatementSkeleton.vue';
import { PROBLEM_LAYOUT } from './problem-layout';
import type { ProblemTab } from './problem-tab';
import { useProblemQuery } from './problems.queries';

const DEFAULT_TAB = 'statement';
const route = useRoute();
const router = useRouter();
const locale = useLocaleStore();
const session = useSessionStore();
const code = computed(() => String(route.params.code));
const { data: problem, isPending, error, refetch } = useProblemQuery(code, toRef(locale, 'locale'));

/** The viewer's current participation holds this problem: the page gains the contest's problem rail. */
const liveContestKey = computed(() => problem.value?.contest?.contestKey ?? null);
/** `?contest=` names the ended contest the reader came from; a live participation wins over it. */
const queriedContestKey = computed(() =>
  typeof route.query.contest === 'string' && route.query.contest ? route.query.contest : null,
);
const contestKey = computed(() => liveContestKey.value ?? queriedContestKey.value);
const { contest: loadedContest, entries: railEntries } = useProblemRail(
  contestKey,
  () => code.value,
);
/** A queried contest gives context only once it has ended; a running one is reached through a participation. */
const contest = computed(() =>
  liveContestKey.value || loadedContest.value?.phase === 'ended' ? loadedContest.value : null,
);
/** The ended-contest context: the rail is shown for reading, and submitting stays a practice submission. */
const isReadOnlyContest = computed(() => liveContestKey.value === null);
/** A problem of a contest (live or opened from an ended one) belongs to "Kỳ thi" in the nav. */
useNavSection(() => (contest.value && railEntries.value ? '/contests' : null));

const isNotFound = computed(
  () => error.value instanceof ApiError && error.value.code === 'not_found',
);

usePageTitle(() => (isNotFound.value ? translate('pages.notFound') : problem.value?.name));

/** The in-place editor is open: the contest's problem list folds to give it room. */
const panelOpen = ref(false);
const { isCollapsed: railCollapsed, toggle: toggleRail } = useProblemRailCollapse(panelOpen);
const layout = computed(
  () => PROBLEM_LAYOUT[contest.value && railEntries.value ? 'contest' : 'plain'],
);

/** Set when the editorial answers 404 for this problem; the tab then disappears until another problem is opened. */
const editorialGone = ref(false);
watch(code, () => {
  editorialGone.value = false;
});

/** The route of each submission tab: the child route's name says which one is open. */
const SUBMISSION_TAB_OF_ROUTE: Record<string, string> = {
  'problem-submissions': 'submissions',
  'problem-mine': 'mine',
  'problem-best': 'best',
};
const isSignedIn = computed(() => session.status === 'authenticated');
/** An ended contest the reader came from stays in the URL while they move between tabs. */
const contextQuery = computed(() =>
  queriedContestKey.value ? { contest: queriedContestKey.value } : {},
);
const linkTo = (name: string, query: Record<string, string> = {}) => ({
  name,
  params: { code: code.value },
  query: { ...contextQuery.value, ...query },
});
/** Page tabs, each a link: statement and editorial are the problem route (`?tab=`), the rest are its child routes. */
const tabs = computed<ProblemTab[]>(() => [
  { id: DEFAULT_TAB, labelKey: 'problem.tabs.statement', to: linkTo('problem') },
  ...(isSignedIn.value
    ? [{ id: 'mine', labelKey: 'problem.tabs.mine', to: linkTo('problem-mine') }]
    : []),
  { id: 'submissions', labelKey: 'problem.tabs.submissions', to: linkTo('problem-submissions') },
  { id: 'best', labelKey: 'problem.tabs.best', to: linkTo('problem-best') },
  ...(problem.value?.hasEditorial && !editorialGone.value
    ? [
        {
          id: 'editorial',
          labelKey: 'problem.tabs.editorial',
          to: linkTo('problem', { tab: 'editorial' }),
        },
      ]
    : []),
]);
const requestedTab = computed(() => (typeof route.query.tab === 'string' ? route.query.tab : null));
const isStatementRoute = computed(() => route.name === 'problem');
/** The open tab: a child route's own, else the statement or (`?tab=editorial`) the editorial. */
const tab = computed(() => {
  const ofRoute = SUBMISSION_TAB_OF_ROUTE[String(route.name)];
  if (ofRoute) return ofRoute;
  return tabs.value.find((candidate) => candidate.id === requestedTab.value)?.id ?? DEFAULT_TAB;
});

// An unknown or unavailable ?tab= (an editorial that does not exist) is dropped once the detail is known.
watch(
  [problem, requestedTab, editorialGone],
  ([loaded, requested]) => {
    if (isStatementRoute.value && loaded && requested !== null && tab.value !== requested)
      void router.replace({ query: { ...route.query, tab: undefined } });
  },
  { immediate: true },
);
</script>

<template>
  <NotFoundPage v-if="isNotFound" />
  <div
    v-else
    :class="[
      'page-column',
      contest && railEntries
        ? [
            'lg:grid lg:items-start',
            railCollapsed
              ? 'lg:grid-cols-[3rem_minmax(0,1fr)]'
              : 'lg:grid-cols-[var(--qh-rail)_minmax(0,1fr)]',
          ]
        : '[--page-width:var(--page-wide)]',
    ]"
  >
    <ContestProblemSwitcher
      v-if="contestKey && contest && railEntries"
      :contest-key="contestKey"
      :contest-name="contest.name"
      :entries="railEntries"
      :carries-contest="isReadOnlyContest"
      :collapsed="railCollapsed"
      @toggle="toggleRail"
    />
    <div class="flex min-w-0 flex-col gap-5">
      <QueryState :loading="isPending" :error="error" @retry="refetch()">
        <template #skeleton>
          <StatementSkeleton header />
        </template>
        <ProblemContent
          v-if="problem"
          :key="problem.code"
          :tab="tab"
          :problem="problem"
          :tabs="tabs"
          :layout="layout"
          :contest="contest && railEntries ? contest : null"
          :contest-is-live="!isReadOnlyContest"
          @gone="editorialGone = true"
          @panel="panelOpen = $event"
        />
      </QueryState>
    </div>
  </div>
</template>
