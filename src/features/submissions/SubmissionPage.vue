<script setup lang="ts">
import { computed, toRef } from 'vue';
import { useRoute } from 'vue-router';
import { ApiError } from '@/api/client';
import GlassCard from '@/components/GlassCard.vue';
import InlineBit from '@/components/InlineBit.vue';
import QueryState from '@/components/QueryState.vue';
import NotFoundPage from '@/features/not-found/NotFoundPage.vue';
import { useProblemQuery } from '@/features/problems/problems.queries';
import { IN_PROGRESS_STATUSES } from '@/api/types/submissions';
import { verdictOf } from '@/lib/verdicts';
import { usePageTitle } from '@/router/page-title';
import { translate } from '@/i18n';
import { useLocaleStore } from '@/stores/locale.store';
import { useViewerId } from '@/stores/use-viewer-id';
import CasesTable from './CasesTable.vue';
import CasesTableSkeleton from './CasesTableSkeleton.vue';
import SourceView from './SourceView.vue';
import SourceViewSkeleton from './SourceViewSkeleton.vue';
import TestOverview from './TestOverview.vue';
import SubmissionSummary from './SubmissionSummary.vue';
import SubmissionSummarySkeleton from './SubmissionSummarySkeleton.vue';
import SubmissionExternalRun from './SubmissionExternalRun.vue';
import SubmissionStaffPanel from './SubmissionStaffPanel.vue';
import { forbiddenMessageKey } from './forbidden-reason';
import { useLiveSubmission } from './use-live-submission';
import DeletedProblemNotice from './DeletedProblemNotice.vue';
import { isProblemDeleted } from './deleted-problem';
import CompareWithForm from './CompareWithForm.vue';
import { submissionShortId } from './submission-short-id';

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
const isOwn = computed(() => row.value?.user?.id === viewerId.value);
const problemCode = computed(() => row.value?.problem?.code ?? null);
/** A deleted problem answers 404: never ask for it, never offer to resubmit to it. */
const isDeletedProblem = computed(() => isProblemDeleted(row.value));
const problemQuery = useProblemQuery(
  computed(() => problemCode.value ?? ''),
  toRef(locale, 'locale'),
  computed(() => problemCode.value !== null && !isDeletedProblem.value),
);

const isNotFound = computed(
  () => query.error.value instanceof ApiError && query.error.value.code === 'not_found',
);
const forbiddenKey = computed(() => forbiddenMessageKey(query.error.value));

/** The stream's status leads only while the grading goes on; a final status shows the stored row, which carries the result. */
const verdict = computed(() => {
  if (!row.value) return null;
  const streamStatus = live.status;
  const isStreamLeading = streamStatus !== null && IN_PROGRESS_STATUSES.includes(streamStatus);
  return verdictOf(isStreamLeading ? { status: streamStatus, result: null } : row.value);
});
</script>

<template>
  <NotFoundPage v-if="isNotFound" />
  <div v-else class="page-column">
    <nav :aria-label="$t('common.breadcrumb')" class="flex items-center gap-2 text-sm">
      <RouterLink :to="{ name: 'submissions' }" class="text-muted hover:underline">{{
        $t('pages.submissions')
      }}</RouterLink>
      <span aria-hidden="true" class="text-muted">/</span>
      <h1 class="font-mono font-semibold">{{ shortId }}</h1>
    </nav>
    <p role="status" aria-live="polite" class="sr-only">
      {{ verdict ? $t(verdict.labelKey) : '' }}
    </p>
    <GlassCard v-if="forbiddenKey" as="div" class="rounded-panel p-6 sm:p-8">
      <div class="flex flex-wrap items-center gap-3">
        <InlineBit kind="sweat" />
        <p role="alert">{{ $t(forbiddenKey) }}</p>
      </div>
    </GlassCard>
    <QueryState
      v-else
      :loading="query.isPending.value"
      :error="query.error.value"
      @retry="query.refetch()"
    >
      <template #skeleton>
        <SubmissionSummarySkeleton />
        <SourceViewSkeleton />
        <CasesTableSkeleton />
      </template>
      <template v-if="row && verdict">
        <p
          v-if="live.stale"
          data-testid="stale-reload"
          class="flex flex-wrap items-center gap-3 text-sm text-muted"
        >
          <InlineBit kind="sweat" />
          {{ $t('submission.staleReload') }}
          <button
            type="button"
            class="min-h-11 rounded-pill border border-line px-4 font-semibold text-content hover:bg-surface-hover"
            @click="refollow()"
          >
            {{ $t('submission.reload') }}
          </button>
        </p>
        <SubmissionSummary
          :submission="row"
          :verdict="verdict"
          :problem-name="problemQuery.data.value?.name ?? null"
          :problem-points="problemQuery.data.value?.points ?? null"
          :is-problem-loading="problemQuery.isLoading.value"
          :is-live="isLive"
        />
        <TestOverview
          v-if="!isDeletedProblem"
          :cases="row.cases"
          :batches="row.batches"
          :points="row.points"
          :problem-points="problemQuery.data.value?.points ?? null"
          :running="isLive"
        />
        <SubmissionExternalRun v-if="row.externalRun" :run="row.externalRun" />
        <SubmissionStaffPanel :submission="row" />
        <SourceView
          :id="row.id"
          :problem-code="isDeletedProblem ? null : problemCode"
          :is-own="isOwn"
          :language-key="row.language?.key ?? null"
          :language-name="row.language?.name ?? null"
        />
        <DeletedProblemNotice v-if="isDeletedProblem" :name="row.problem?.name ?? ''" />
        <CasesTable
          v-else
          :cases="row.cases"
          :batches="row.batches"
          :total-cases="row.totalCases"
          :running="isLive"
          :compile-error="row.status === 'CE' ? row.error : null"
        />
        <CompareWithForm :current-id="row.id" />
      </template>
    </QueryState>
  </div>
</template>
