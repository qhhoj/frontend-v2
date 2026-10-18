<script setup lang="ts">
import { computed, toRef } from 'vue';
import { useRoute } from 'vue-router';
import { ApiError } from '@/api/client';
import AppButton from '@/components/ui/AppButton.vue';
import Card from '@/components/ui/Card.vue';
import InlineBit from '@/components/InlineBit.vue';
import QueryState from '@/components/QueryState.vue';
import NotFoundPage from '@/features/not-found/NotFoundPage.vue';
import { useProblemQuery } from '@/features/problems/problems.queries';
import { IN_PROGRESS_STATUSES } from '@/api/types/submissions';
import { submissionVerdictOf, verdictOf } from '@/lib/verdicts';
import { usePageTitle } from '@/router/page-title';
import { translate } from '@/i18n';
import { useLocaleStore } from '@/stores/locale.store';
import { useViewerId } from '@/stores/use-viewer-id';
import CasesTable from './CasesTable.vue';
import CasesTableSkeleton from './CasesTableSkeleton.vue';
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

/** The score card (staff actions inside) beside the facts card from lg; the tests and the source below, full width. */
const SUMMARY = 'grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]';
const STACK = 'flex min-w-0 flex-col gap-5';

const route = useRoute();
const locale = useLocaleStore();
const id = computed(() => String(route.params.id));
const { submission: query, live, isLive, refollow } = useLiveSubmission(id);
const row = query.data;
const shortId = computed(() => submissionShortId(id.value));
usePageTitle(() => translate('pages.submissionTitle', { id: shortId.value }));

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
const canResubmit = computed(
  () => isOwn.value && problemCode.value !== null && !isDeletedProblem.value,
);

const isNotFound = computed(
  () => query.error.value instanceof ApiError && query.error.value.code === 'not_found',
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
</script>

<template>
  <NotFoundPage v-if="isNotFound" />
  <div v-else class="page-column">
    <nav
      :aria-label="$t('common.breadcrumb')"
      class="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1 text-sm"
    >
      <RouterLink :to="{ name: 'submissions' }" class="text-muted hover:underline">{{
        $t('pages.submissions')
      }}</RouterLink>
      <span aria-hidden="true" class="text-muted">/</span>
      <h1 class="min-w-0 font-semibold [overflow-wrap:anywhere]">
        {{ problemName ?? shortId }}
      </h1>
      <span v-if="problemName" class="font-mono text-meta text-muted">{{ shortId }}</span>
    </nav>
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
        <CasesTableSkeleton />
        <SourceViewSkeleton />
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
          >
            <SubmissionStaffPanel :submission="row" />
          </SubmissionHero>
          <SubmissionFacts :submission="row" :problem-name="problemName" />
        </div>
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
        <CasesTable
          v-else
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
            />
          </template>
        </CasesTable>
        <SourceView
          :id="row.id"
          :access="row.sourceAccess"
          :language-key="row.language?.key ?? null"
          :language-name="row.language?.name ?? null"
        >
          <CompareWithForm :current-id="row.id" />
        </SourceView>
      </div>
    </QueryState>
  </div>
</template>
