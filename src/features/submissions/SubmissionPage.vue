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
import SubmissionSummary from './SubmissionSummary.vue';
import SubmissionSummarySkeleton from './SubmissionSummarySkeleton.vue';
import { forbiddenMessageKey } from './forbidden-reason';
import { useLiveSubmission } from './use-live-submission';

/** Ids are long uuids: the first and last characters tell them apart. Shorter ids are shown whole. */
const ID_HEAD_LENGTH = 6;
const ID_TAIL_LENGTH = 3;
const route = useRoute();
const locale = useLocaleStore();
const id = computed(() => String(route.params.id));
const { submission: query, live, isLive, refollow } = useLiveSubmission(id);
const row = query.data;
const shortId = computed(() =>
  id.value.length <= ID_HEAD_LENGTH + ID_TAIL_LENGTH
    ? `#${id.value}`
    : `#${id.value.slice(0, ID_HEAD_LENGTH)}…${id.value.slice(-ID_TAIL_LENGTH)}`,
);
usePageTitle(() => translate('pages.submissionTitle', { id: shortId.value }));

// The problem gives the points and the name; it may be unreadable for this viewer, then the row's own name stands in.
/** Loading another user's code into the viewer's editor is surprising, so only the author may resubmit. */
const viewerId = useViewerId();
const isOwn = computed(() => row.value?.user?.id === viewerId.value);
const problemCode = computed(() => row.value?.problem?.code ?? null);
const problemQuery = useProblemQuery(
  computed(() => problemCode.value ?? ''),
  toRef(locale, 'locale'),
  computed(() => problemCode.value !== null),
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
  <div v-else class="mx-auto flex max-w-[1280px] flex-col gap-5 px-4 py-6 sm:px-8">
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
        <CasesTable
          :cases="row.cases"
          :batches="row.batches"
          :total-cases="row.totalCases"
          :running="isLive"
          :compile-error="row.status === 'CE' ? row.error : null"
        />
        <SourceView :id="row.id" :problem-code="problemCode" :is-own="isOwn" />
      </template>
    </QueryState>
  </div>
</template>
