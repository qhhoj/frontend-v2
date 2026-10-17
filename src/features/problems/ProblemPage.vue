<script setup lang="ts">
import { computed, ref, toRef, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ApiError } from '@/api/client';
import QueryState from '@/components/QueryState.vue';
import ContestProblemSwitcher from '@/features/contests/ContestProblemSwitcher.vue';
import { useProblemRail } from '@/features/contests/use-problem-rail';
import NotFoundPage from '@/features/not-found/NotFoundPage.vue';
import { useNavSection } from '@/features/shell/nav-section';
import { usePageTitle } from '@/router/page-title';
import { useLocaleStore } from '@/stores/locale.store';
import ProblemContent from './ProblemContent.vue';
import ProblemRailSkeleton from './ProblemRailSkeleton.vue';
import StatementSkeleton from './StatementSkeleton.vue';
import { PROBLEM_LAYOUT } from './problem-layout';
import { useProblemQuery } from './problems.queries';

const DEFAULT_TAB = 'statement';
const route = useRoute();
const router = useRouter();
const locale = useLocaleStore();
const code = computed(() => String(route.params.code));
const { data: problem, isPending, error, refetch } = useProblemQuery(code, toRef(locale, 'locale'));

/** The viewer's current participation holds this problem: the page gains the contest's problem rail (M5B). */
const contestKey = computed(() => problem.value?.contest?.contestKey ?? null);
/** Two columns only once the rail has its rows; while the contest loads or fails the statement keeps the full width. */
const { contest, entries: railEntries } = useProblemRail(contestKey, () => code.value);
/** A problem solved inside the viewer's contest belongs to "Kỳ thi" in the nav (P-15). */
useNavSection(() => (contestKey.value ? '/contests' : null));

usePageTitle(() => problem.value?.name);

const layout = computed(
  () => PROBLEM_LAYOUT[contest.value && railEntries.value ? 'contest' : 'plain'],
);

/** Set when the editorial answers 404 for this problem; the tab then disappears until another problem is opened. */
const editorialGone = ref(false);
watch(code, () => {
  editorialGone.value = false;
});

const isNotFound = computed(
  () => error.value instanceof ApiError && error.value.code === 'not_found',
);

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
        : '[--page-width:80rem]',
    ]"
  >
    <ContestProblemSwitcher
      v-if="contestKey && contest && railEntries"
      :contest-key="contestKey"
      :contest-name="contest.name"
      :entries="railEntries"
    />
    <div class="flex min-w-0 flex-col gap-5">
      <QueryState :loading="isPending" :error="error" @retry="refetch()">
        <template #skeleton>
          <div :class="layout.grid">
            <StatementSkeleton header :strip-class="layout.strip" :class="layout.left" />
            <ProblemRailSkeleton data-testid="problem-rail" :class="layout.rail" />
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
          @gone="editorialGone = true"
        />
      </QueryState>
    </div>
  </div>
</template>
