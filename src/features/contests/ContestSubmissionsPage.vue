<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import { ApiError } from '@/api/client';
import EmptyState from '@/components/EmptyState.vue';
import GlassCard from '@/components/GlassCard.vue';
import QueryState from '@/components/QueryState.vue';
import SubmitSignInLink from '@/features/problems/SubmitSignInLink.vue';
import { useProblemMetaQuery } from '@/features/problems/problems.queries';
import SubmissionFilterRail from '@/features/submissions/SubmissionFilterRail.vue';
import SubmissionPager from '@/features/submissions/SubmissionPager.vue';
import SubmissionTable from '@/features/submissions/SubmissionTable.vue';
import SubmissionTableSkeleton from '@/features/submissions/SubmissionTableSkeleton.vue';
import {
  SUBMISSION_PAGE_SIZE,
  useContestSubmissionListQuery,
} from '@/features/submissions/submissions.queries';
import type { ColumnKey } from '@/features/submissions/submission-table-cells';
import { useSubmissionFilters } from '@/features/submissions/use-submission-filters';
import { useNow } from '@/lib/use-now';
import { usePageTitle } from '@/router/page-title';
import { useSessionStore } from '@/stores/session.store';
import ContestCompactHeader from './ContestCompactHeader.vue';
import ContestNotFound from './ContestNotFound.vue';
import ContestTabs from './ContestTabs.vue';
import { useContestQuery } from './contests.queries';
import { ownSubmissionsOnly } from './own-submissions';

const route = useRoute();
const session = useSessionStore();
const key = computed(() => String(route.params.key));
const { data: contest, error: contestError } = useContestQuery(key);
const { filters, update, reset } = useSubmissionFilters();
const { data: meta } = useProblemMetaQuery();
const now = useNow(30_000);
const isOwnOnly = computed(() =>
  contest.value ? ownSubmissionsOnly(contest.value, now.value) : false,
);
const ownUsername = computed(() => (isOwnOnly.value ? (session.user?.username ?? null) : null));
/** A visitor on a narrowed list would get a 403: ask them to sign in instead. */
const canAsk = computed(() => Boolean(contest.value) && !(isOwnOnly.value && !session.user));
const {
  data: list,
  isPending,
  error,
  refetch,
  isPlaceholderData,
} = useContestSubmissionListQuery(key, filters, ownUsername, canAsk);
const labels = computed(() =>
  Object.fromEntries(
    (contest.value?.problems ?? []).map((problem) => [problem.code, problem.label]),
  ),
);
const rows = computed(() => list.value?.items ?? []);
/** The narrowed list shows the mock's columns (the score is in the verdict block): every row is the viewer's own, so user, language and cost add nothing. */
const OWN_ONLY_COLUMNS: readonly ColumnKey[] = ['verdict', 'problem', 'when'];
const listColumns = computed(() => (isOwnOnly.value ? OWN_ONLY_COLUMNS : undefined));
const isMissing = computed(
  () => contestError.value instanceof ApiError && contestError.value.status === 404,
);
usePageTitle(() => contest.value?.name);
const listTop = ref<HTMLElement | null>(null);
function goToPage(page: number) {
  update({ page });
  listTop.value?.scrollIntoView({ block: 'start' });
}
</script>

<template>
  <div class="page-column">
    <ContestNotFound v-if="isMissing" />
    <template v-else>
      <ContestTabs :contest-key="key" :phase="contest?.phase" />
      <ContestCompactHeader v-if="contest" :contest="contest" />
      <p
        v-if="isOwnOnly"
        data-testid="own-only"
        role="note"
        class="glass flex flex-wrap items-center gap-3 rounded-tile px-5 py-3.5"
      >
        <strong>{{ $t('contests.submissions.ownOnlyTitle') }}</strong>
        <span class="text-muted">{{ $t('contests.submissions.ownOnlyBody') }}</span>
        <SubmitSignInLink v-if="!session.user" label-key="contests.submissions.signIn" />
      </p>
      <div v-if="canAsk" class="flex flex-col items-stretch gap-5 md:flex-row md:items-start">
        <SubmissionFilterRail
          :filters="filters"
          :languages="meta?.languages ?? []"
          :show-live="false"
          :show-user="!isOwnOnly"
          show-status-groups
          @update="update"
          @reset="reset"
        />
        <div ref="listTop" class="min-w-0 flex-1 scroll-mt-20" :aria-busy="isPlaceholderData">
          <QueryState :loading="isPending" :error="error" @retry="refetch()">
            <template #skeleton><SubmissionTableSkeleton :column-keys="listColumns" /></template>
            <GlassCard v-if="!rows.length" as="div">
              <EmptyState>{{ $t('contests.submissions.empty') }}</EmptyState>
            </GlassCard>
            <SubmissionTable
              v-else
              :submissions="rows"
              :problem-labels="labels"
              :column-keys="listColumns"
            />
            <SubmissionPager
              :page="filters.page"
              :page-size="SUBMISSION_PAGE_SIZE"
              :total="list?.meta.total"
              :item-count="rows.length"
              @update:page="goToPage"
            />
          </QueryState>
        </div>
      </div>
    </template>
  </div>
</template>
