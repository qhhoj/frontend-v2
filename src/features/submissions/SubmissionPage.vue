<script setup lang="ts">
import { computed, toRef } from 'vue';
import { useRoute } from 'vue-router';
import { ApiError } from '@/api/client';
import AppButton from '@/components/ui/AppButton.vue';
import Card from '@/components/ui/Card.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import type { PageCrumb } from '@/components/ui/PageHeader.vue';
import InlineBit from '@/components/InlineBit.vue';
import QueryState from '@/components/QueryState.vue';
import NotFoundPage from '@/features/not-found/NotFoundPage.vue';
import SubmissionNextStep from '@/features/contests/submission/SubmissionNextStep.vue';
import { useContestScore } from '@/features/contests/submission/use-contest-score';
import { useSubmissionContest } from '@/features/contests/submission/use-submission-contest';
import { useNavSection } from '@/features/shell/nav-section';
import { useProblemQuery } from '@/features/problems/problems.queries';
import { IN_PROGRESS_STATUSES } from '@/api/types/submissions';
import { submissionVerdictOf, verdictOf } from '@/lib/verdicts';
import { usePageTitle } from '@/router/page-title';
import { translate } from '@/i18n';
import { useLocaleStore } from '@/stores/locale.store';
import { useViewerId } from '@/stores/use-viewer-id';
import CasesTable from './CasesTable.vue';
import CasesTableSkeleton from './CasesTableSkeleton.vue';
import ResultSummaryCard from './ResultSummaryCard.vue';
import SourceView from './SourceView.vue';
import SourceViewSkeleton from './SourceViewSkeleton.vue';
import TestOverview from './TestOverview.vue';
import SubmissionFacts from './SubmissionFacts.vue';
import SubmissionFactsSkeleton from './SubmissionFactsSkeleton.vue';
import SubmissionHero from './SubmissionHero.vue';
import SubmissionHeroSkeleton from './SubmissionHeroSkeleton.vue';
import SubmissionExternalRun from './SubmissionExternalRun.vue';
import SubmissionStaffPanel from './SubmissionStaffPanel.vue';
import { forbiddenMessageKey } from './forbidden-reason';
import { useLiveSubmission } from './use-live-submission';
import DeletedProblemNotice from './DeletedProblemNotice.vue';
import InternalErrorNotice from './InternalErrorNotice.vue';
import { isProblemDeleted } from './deleted-problem';
import CompareWithForm from './CompareWithForm.vue';
import { submissionShortId } from './submission-short-id';

/**
 * The score card (staff actions inside) beside the facts card from xl, three parts to two: the score is the page's main
 * information and the facts are short rows, and an equal split left "100 / 100 điểm kỳ thi" too little room to stay on one
 * line. The body below keeps the same columns (owner pick B): from xl the source in the wide one and the test results in
 * the rail, so a failing test's feedback sits beside the code; below xl one column, the result summary, the source, then
 * the full table. One DOM for both: the summary card hides from xl and the grid places the other two.
 */
const SUMMARY =
  'grid grid-cols-[minmax(0,1fr)] gap-5 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] xl:items-start';
const STACK = 'flex min-w-0 flex-col gap-5';
const SOURCE_PLACE = 'xl:col-start-1 xl:row-start-1';
const RESULTS_PLACE = 'xl:col-start-2 xl:row-start-1';

const route = useRoute();
const locale = useLocaleStore();
const id = computed(() => String(route.params.id));
const { submission: query, live, isLive, refollow } = useLiveSubmission(id);
const row = query.data;
const shortId = computed(() => submissionShortId(id.value));

// The problem gives the points and the name; it may be unreadable for this viewer, then the row's own name stands in.
/** Loading another user's code into the viewer's editor is surprising, so only the author may resubmit. */
const viewerId = useViewerId();
const isOwn = computed(() => viewerId.value !== null && row.value?.user?.id === viewerId.value);
const problemCode = computed(() => row.value?.problem?.code ?? null);
/** A deleted problem answers 404: never ask for it, never offer to resubmit to it. */
const isDeletedProblem = computed(() => isProblemDeleted(row.value));
const problemQuery = useProblemQuery(
  computed(() => problemCode.value ?? ''),
  toRef(locale, 'locale'),
  computed(() => problemCode.value !== null && !isDeletedProblem.value),
);

const problemName = computed(
  () => problemQuery.data.value?.name ?? row.value?.problem?.name ?? null,
);
/** A contest submission (P-14 B): the page belongs to "Kỳ thi" and scores in contest points; the next problem and the run minute only for the viewer's own submission in their running run. */
const inContest = useSubmissionContest(row, isOwn);
useNavSection(() => (inContest.value ? '/contests' : null));
const contestScore = useContestScore(row, inContest);
/** The page title is the problem (with its contest label); the crumbs lead to the list the submission belongs to, the contest or all submissions. */
const heading = computed(() => {
  const label = inContest.value ? `${inContest.value.problem.label}. ` : '';
  const parent: PageCrumb[] = inContest.value
    ? [
        { label: translate('contests.title'), to: { name: 'contests' } },
        {
          label: inContest.value.contest.name,
          to: { name: 'contest', params: { key: inContest.value.contest.key } },
        },
      ]
    : [{ label: translate('pages.submissions'), to: { name: 'submissions' } }];
  const nearest = parent[parent.length - 1]!;
  return {
    title: `${label}${problemName.value ?? shortId.value}`,
    crumbs: parent,
    back: { to: nearest.to!, label: nearest.label },
  };
});
const canResubmit = computed(
  () => isOwn.value && problemCode.value !== null && !isDeletedProblem.value,
);

const isNotFound = computed(
  () => query.error.value instanceof ApiError && query.error.value.code === 'not_found',
);
usePageTitle(() =>
  isNotFound.value
    ? translate('pages.notFound')
    : translate('pages.submissionTitle', { id: shortId.value }),
);
const forbiddenKey = computed(() => forbiddenMessageKey(query.error.value));

/** The stream's status leads only while the grading goes on; a final status shows the stored row, which carries the result (PC when partial). */
const verdict = computed(() => {
  if (!row.value) return null;
  const streamStatus = live.status;
  const isStreamLeading = streamStatus !== null && IN_PROGRESS_STATUSES.includes(streamStatus);
  return isStreamLeading
    ? verdictOf({ status: streamStatus, result: null })
    : submissionVerdictOf(row.value);
});
/** Tests to sum up above the source (graded, or waiting while the grading goes on); without them (compile error, hidden
 * results) the result card is short and itself comes before the source. */
const hasResultSummary = computed(() => {
  const cases = row.value?.cases;
  return !!cases && (cases.length > 0 || (isLive.value && !!row.value?.totalCases));
});
</script>

<template>
  <NotFoundPage v-if="isNotFound" />
  <div v-else class="page-column">
    <PageHeader
      :title="heading.title"
      :crumbs="heading.crumbs"
      :back="heading.back"
      :meta="problemName ? [shortId] : []"
    />
    <p role="status" aria-live="polite" class="sr-only">
      {{ verdict ? $t(verdict.labelKey) : '' }}
    </p>
    <Card v-if="forbiddenKey" as="div" class="rounded-card p-6 sm:p-8">
      <div class="flex flex-wrap items-center gap-3">
        <InlineBit kind="sweat" />
        <p role="alert">{{ $t(forbiddenKey) }}</p>
      </div>
    </Card>
    <QueryState
      v-else
      :loading="query.isPending.value"
      :error="query.error.value"
      @retry="query.refetch()"
    >
      <template #skeleton>
        <div :class="SUMMARY">
          <SubmissionHeroSkeleton />
          <SubmissionFactsSkeleton />
        </div>
        <!-- Results first, as the page puts its result summary above the source below xl; from xl the grid places both. -->
        <div :class="SUMMARY">
          <CasesTableSkeleton :class="RESULTS_PLACE" />
          <SourceViewSkeleton :class="SOURCE_PLACE" />
        </div>
      </template>
      <div v-if="row && verdict" :class="STACK">
        <div :class="SUMMARY">
          <SubmissionHero
            :submission="row"
            :verdict="verdict"
            :problem-points="problemQuery.data.value?.points ?? null"
            :is-problem-loading="problemQuery.isLoading.value"
            :is-live="isLive"
            :can-resubmit="canResubmit"
            :contest-score="contestScore"
          >
            <SubmissionStaffPanel :submission="row" />
          </SubmissionHero>
          <SubmissionFacts :submission="row" :problem-name="problemName" :in-contest="inContest" />
        </div>
        <SubmissionNextStep v-if="inContest?.next" :next="inContest.next" />
        <p
          v-if="live.stale"
          data-testid="stale-reload"
          class="flex flex-wrap items-center gap-3 text-sm text-muted"
        >
          <InlineBit kind="sweat" />
          {{ $t('submission.staleReload') }}
          <AppButton @click="refollow()">
            {{ $t('submission.reload') }}
          </AppButton>
        </p>
        <InternalErrorNotice v-if="row.status === 'IE'" :message="row.error" />
        <SubmissionExternalRun v-if="row.externalRun" :run="row.externalRun" />
        <DeletedProblemNotice v-if="isDeletedProblem" :name="row.problem?.name ?? ''" />
        <div :class="SUMMARY">
          <ResultSummaryCard
            v-if="!isDeletedProblem && hasResultSummary"
            :key="row.id"
            class="xl:hidden"
            :cases="row.cases ?? []"
            :batches="row.batches"
            :total-cases="row.totalCases"
            :running="isLive"
          />
          <SourceView
            :id="row.id"
            :class="isDeletedProblem ? 'xl:col-span-2' : SOURCE_PLACE"
            :access="row.sourceAccess"
            :language-key="row.language?.key ?? null"
            :language-name="row.language?.name ?? null"
          >
            <CompareWithForm :current-id="row.id" />
          </SourceView>
          <CasesTable
            v-if="!isDeletedProblem"
            :class="[RESULTS_PLACE, !hasResultSummary && 'max-xl:order-first']"
            :summarized="hasResultSummary"
            :cases="row.cases"
            :batches="row.batches"
            :total-cases="row.totalCases"
            :running="isLive"
            :compile-error="row.status === 'CE' ? row.error : null"
            :compile-log-hidden="row.status === 'CE' && !row.error"
          >
            <template #footer>
              <TestOverview
                :cases="row.cases"
                :batches="row.batches"
                :points="row.points"
                :problem-points="row.problem?.points ?? null"
                :case-points="row.casePoints"
                :case-total="row.caseTotal"
                :running="isLive"
                :in-contest="contestScore !== null"
              />
            </template>
          </CasesTable>
        </div>
      </div>
    </QueryState>
  </div>
</template>
