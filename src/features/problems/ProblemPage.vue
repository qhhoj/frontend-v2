<script setup lang="ts">
import { computed, ref, toRef, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ApiError } from '@/api/client';
import GlassCard from '@/components/GlassCard.vue';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import UserName from '@/components/UserName.vue';
import ContestProblemSwitcher from '@/features/contests/ContestProblemSwitcher.vue';
import { useProblemRail } from '@/features/contests/use-problem-rail';
import NotFoundPage from '@/features/not-found/NotFoundPage.vue';
import ProblemArchivedNotice from '@/features/organizations/problems/ProblemArchivedNotice.vue';
import ShortLinkButton from '@/features/short-links/ShortLinkButton.vue';
import { shortLinkPath } from '@/features/short-links/short-link-path';
import { usePageTitle } from '@/router/page-title';
import { useLocaleStore } from '@/stores/locale.store';
import EditorialTab from './EditorialTab.vue';
import ProblemHeader from './ProblemHeader.vue';
import PdfButton from './PdfButton.vue';
import ProblemSubmissionsTab from './ProblemSubmissionsTab.vue';
import ProblemHeaderSkeleton from './ProblemHeaderSkeleton.vue';
import ProblemTabs from './ProblemTabs.vue';
import StatementBody from './StatementBody.vue';
import StatementSkeleton from './StatementSkeleton.vue';
import SubmitDock from './SubmitDock.vue';
import { useProblemQuery } from './problems.queries';

const DEFAULT_TAB = 'statement';
const SKELETON_TAB_COUNT = 3;
const route = useRoute();
const router = useRouter();
const locale = useLocaleStore();
const code = computed(() => String(route.params.code));
const { data: problem, isPending, error, refetch } = useProblemQuery(code, toRef(locale, 'locale'));

/** The viewer's current participation holds this problem: the page gains the contest's problem rail (M5B). */
const contestKey = computed(() => problem.value?.contest?.contestKey ?? null);
/** Two columns only once the rail has its rows; while the contest loads or fails the statement keeps the full width. */
const { contest, entries: railEntries } = useProblemRail(contestKey, () => code.value);

usePageTitle(() => problem.value?.name);

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
  { id: 'submissions', labelKey: 'problem.tabs.submissions' },
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
      'mx-auto flex flex-col gap-5 px-4 py-6 sm:px-8',
      contest && railEntries
        ? 'max-w-[1240px] lg:grid lg:grid-cols-[240px_minmax(0,1fr)] lg:items-start lg:gap-6'
        : 'max-w-[960px]',
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
          <ProblemHeaderSkeleton />
          <div data-skeleton-region="tabs" class="flex flex-wrap gap-2">
            <SkeletonBlock
              v-for="index in SKELETON_TAB_COUNT"
              :key="index"
              pill
              class="h-11 w-24"
            />
          </div>
          <StatementSkeleton />
        </template>
        <template v-if="problem">
          <ProblemArchivedNotice :code="problem.code" :organization-ids="problem.organizations" />
          <ProblemHeader :problem="problem"
            ><template #actions
              ><div class="flex flex-wrap items-center gap-2">
                <ShortLinkButton :path="shortLinkPath({ kind: 'problem', code: problem.code })" />
                <PdfButton
                  v-if="problem.pdfStatementUrl"
                  :code="problem.code"
                  :lang="locale.locale"
                /></div></template
          ></ProblemHeader>
          <ProblemTabs v-model="tab" :tabs="tabs" :label="$t('problem.tabsLabel')" />
          <div
            v-for="panel in tabs"
            :id="`problem-panel-${panel.id}`"
            :key="panel.id"
            role="tabpanel"
            :aria-labelledby="`problem-tab-${panel.id}`"
            :hidden="panel.id !== tab"
            :tabindex="panel.id === tab ? 0 : undefined"
          >
            <GlassCard
              v-if="panel.id === DEFAULT_TAB && tab === DEFAULT_TAB"
              as="div"
              data-testid="statement-card"
              class="rounded-panel p-6 text-[15px] sm:p-8"
            >
              <p v-if="!problem.translated" class="mb-4 text-sm text-muted">
                {{ $t('problem.untranslated') }}
              </p>
              <StatementBody :html="problem.descriptionHtml" />
              <p v-if="problem.authors.length" class="mt-6 text-sm text-muted">
                {{ $t('problem.authors') }}
                <template v-for="(author, index) in problem.authors" :key="author.id"
                  ><template v-if="index">, </template><UserName :username="author.username"
                /></template>
              </p>
            </GlassCard>
            <!-- Mounted only while selected, so the editorial request is lazy. -->
            <EditorialTab
              v-if="panel.id === 'editorial' && tab === 'editorial'"
              :code="code"
              @gone="editorialGone = true"
            />
            <ProblemSubmissionsTab
              v-if="panel.id === 'submissions' && tab === 'submissions'"
              :code="code"
            />
          </div>
          <!-- Keyed by code: another problem never inherits the typed code, pick or file. -->
          <SubmitDock :key="problem.code" :problem="problem" />
        </template>
      </QueryState>
    </div>
  </div>
</template>
