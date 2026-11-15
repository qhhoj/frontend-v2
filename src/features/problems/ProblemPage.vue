<script setup lang="ts">
import { computed, ref, toRef, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ApiError } from '@/api/client';
import QueryState from '@/components/QueryState.vue';
import ContestProblemSwitcher from '@/features/contests/ContestProblemSwitcher.vue';
import { useProblemRail } from '@/features/contests/use-problem-rail';
import NotFoundPage from '@/features/not-found/NotFoundPage.vue';
import { useNavSection } from '@/features/shell/nav-section';
import { useMediaQuery } from '@/lib/use-media-query';
import { translate } from '@/i18n';
import { usePageTitle } from '@/router/page-title';
import { useLocaleStore } from '@/stores/locale.store';
import { useSessionStore } from '@/stores/session.store';
import ProblemContent from './ProblemContent.vue';
import StatementSkeleton from './StatementSkeleton.vue';
import SubmitPaneSkeleton from './SubmitPaneSkeleton.vue';
import { PROBLEM_LAYOUT } from './problem-layout';
import { useProblemQuery } from './problems.queries';

const DEFAULT_TAB = 'statement';
const route = useRoute();
const router = useRouter();
const locale = useLocaleStore();
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

const session = useSessionStore();
const hasEditor = computed(() => session.status === 'authenticated');
const layout = computed(
  () => PROBLEM_LAYOUT[contest.value && railEntries.value ? 'contest' : 'plain'],
);
/** Where the statement takes the whole column, the loading page shows no pane: the sheet's bar is fixed below. */
const isStacked = useMediaQuery(() => layout.value.stacked);

/** Set when the editorial answers 404 for this problem; the tab then disappears until another problem is opened. */
const editorialGone = ref(false);
watch(code, () => {
  editorialGone.value = false;
});

/** Page tabs; 8e adds `discussion` here. */
const tabs = computed(() => [
  { id: DEFAULT_TAB, labelKey: 'problem.tabs.statement' },
  ...(problem.value?.hasEditorial && !editorialGone.value
    ? [{ id: 'editorial', labelKey: 'problem.tabs.editorial' }]
    : []),
]);
const requestedTab = computed(() => (typeof route.query.tab === 'string' ? route.query.tab : null));
const tab = computed({
  get: () => tabs.value.find((candidate) => candidate.id === requestedTab.value)?.id ?? DEFAULT_TAB,
  set: (id: string) =>
    void router.replace({
      query: { ...route.query, tab: id === DEFAULT_TAB ? undefined : id },
    }),
});

// An unknown or unavailable ?tab= (an editorial that does not exist) is dropped once the detail is known.
watch(
  [problem, requestedTab, editorialGone],
  ([loaded, requested]) => {
    if (loaded && requested !== null && tab.value !== requested)
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
        ? 'lg:grid lg:grid-cols-[240px_minmax(0,1fr)] lg:items-start'
        : '[--page-width:120rem]',
    ]"
  >
    <ContestProblemSwitcher
      v-if="contestKey && contest && railEntries"
      :contest-key="contestKey"
      :contest-name="contest.name"
      :entries="railEntries"
      :carries-contest="isReadOnlyContest"
    />
    <div class="flex min-w-0 flex-col gap-5">
      <QueryState :loading="isPending" :error="error" @retry="refetch()">
        <template #skeleton>
          <div :class="[layout.grid, hasEditor ? layout.columns.editor : layout.columns.signIn]">
            <StatementSkeleton header :class="layout.left" />
            <SubmitPaneSkeleton v-if="hasEditor && !isStacked" :class="layout.pane" />
          </div>
        </template>
        <ProblemContent
          v-if="problem"
          :key="problem.code"
          v-model:tab="tab"
          :problem="problem"
          :tabs="tabs"
          :layout="layout"
          :contest="contest && railEntries ? contest : null"
          :contest-is-live="!isReadOnlyContest"
          @gone="editorialGone = true"
        />
      </QueryState>
    </div>
  </div>
</template>
