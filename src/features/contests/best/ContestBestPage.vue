<script setup lang="ts">
import PageHeader from '@/components/ui/PageHeader.vue';
import AppButton from '@/components/ui/AppButton.vue';
import { ArrowLeft, Info, TriangleAlert } from 'lucide-vue-next';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import { ApiError } from '@/api/client';
import EmptyState from '@/components/EmptyState.vue';
import Card from '@/components/ui/Card.vue';
import NumberedPager from '@/components/NumberedPager.vue';
import QueryState from '@/components/QueryState.vue';
import StatePanel from '@/components/StatePanel.vue';
import SubmissionTable from '@/features/submissions/SubmissionTable.vue';
import SubmissionTableSkeleton from '@/features/submissions/SubmissionTableSkeleton.vue';
import { SUBMISSION_PAGE_SIZE } from '@/features/submissions/list/submission-scope';
import { useContestBestSubmissionsQuery } from '@/features/submissions/submissions.queries';
import { formatDate } from '@/lib/format-date';
import { pageFromQuery } from '@/lib/paging';
import { PHONE_QUERY, useMediaQuery } from '@/lib/use-media-query';
import { usePageTitle } from '@/router/page-title';
import { useLocaleStore } from '@/stores/locale.store';
import { useSessionStore } from '@/stores/session.store';
import ContestNotFound from '../ContestNotFound.vue';
import ContestTabs from '../ContestTabs.vue';
import { useContestQuery } from '../contests.queries';

/** `/contests/:key/problems/:code/best`: the best submission of each user on one contest problem, A-E chips to switch problem. */
const route = useRoute();
const { t } = useI18n();
const locale = useLocaleStore();
const session = useSessionStore();
const key = computed(() => String(route.params.key));
const code = computed(() => String(route.params.code));
const page = computed(() => pageFromQuery(route.query.page));
const { data: contest, error: contestError, refetch: refetchContest } = useContestQuery(key);
const { data: list, isPending, error, refetch } = useContestBestSubmissionsQuery(key, code, page);
const problems = computed(() => contest.value?.problems ?? []);
const current = computed(() => problems.value.find((problem) => problem.code === code.value));
const heading = computed(() =>
  t('contests.best.title', {
    problem: current.value ? `${current.value.label}. ${current.value.name}` : code.value,
  }),
);
usePageTitle(() => (contest.value ? `${heading.value} · ${contest.value.name}` : null));
/** The rows score in the contest's points, so the denominator is the contest problem's, not the problem's own. */
const rows = computed(() =>
  (list.value?.items ?? []).map((row) =>
    row.problem && current.value
      ? { ...row, problem: { ...row.problem, points: current.value.points } }
      : row,
  ),
);
const rankStart = computed(() => ((list.value?.meta.page ?? 1) - 1) * SUBMISSION_PAGE_SIZE + 1);
const frozenAt = computed(() => contest.value?.viewer.boardFrozenAt ?? null);
const statusOf = (failure: unknown) => (failure instanceof ApiError ? failure.status : null);
const isMissing = computed(
  () => statusOf(contestError.value) === 404 || statusOf(error.value) === 404,
);
/** The back button sits in the header from `md`; a phone reaches the contest through the tabs. */
const isPhone = useMediaQuery(PHONE_QUERY);
const isRefused = computed(() => statusOf(error.value) === 403);
const CHIP =
  'inline-flex min-h-11 min-w-11 items-center justify-center rounded-pill border border-line-strong px-4 font-display font-bold text-muted hover:bg-surface-hover aria-[current=page]:border-accent aria-[current=page]:bg-accent-soft aria-[current=page]:text-accent-soft-text';
</script>

<template>
  <div class="page-column">
    <ContestNotFound v-if="statusOf(contestError) === 404" />
    <StatePanel v-else-if="contestError" kind="error" :title="$t('contests.best.loadFailed')"
      ><AppButton @click="refetchContest()">
        {{ $t('contests.best.retry') }}
      </AppButton></StatePanel
    >
    <template v-else>
      <ContestTabs :contest-key="key" :phase="contest?.phase" current="contest" />
      <PageHeader :title="heading" :lead="contest?.name">
        <template v-if="!isPhone" #actions>
          <AppButton :to="{ name: 'contest', params: { key } }">
            <template #icon><ArrowLeft class="size-4" aria-hidden="true" /></template>
            {{ $t('contests.best.back') }}
          </AppButton>
        </template>
      </PageHeader>
      <nav :aria-label="$t('contests.best.problems')" class="flex flex-wrap gap-2">
        <RouterLink
          v-for="problem in problems"
          :key="problem.problemId"
          :to="{ name: 'contest-problem-best', params: { key, code: problem.code } }"
          :aria-current="problem.code === code ? 'page' : undefined"
          :title="problem.name"
          :class="CHIP"
          >{{ problem.label }}</RouterLink
        >
      </nav>
      <StatePanel
        v-if="isRefused"
        kind="forbidden"
        :title="$t('contests.best.forbiddenTitle')"
        :body="$t('contests.best.forbiddenBody')"
      />
      <StatePanel v-else-if="isMissing" kind="notFound" :title="$t('contests.best.missingTitle')" />
      <QueryState v-else :loading="isPending" :error="error" @retry="refetch()">
        <template #skeleton><SubmissionTableSkeleton :show-problem="false" /></template>
        <Card as="div" class="overflow-hidden">
          <p
            v-if="frozenAt"
            data-testid="best-frozen"
            class="flex items-center gap-2.5 bg-tag-4-bg px-5 py-3 text-meta font-semibold text-tag-4"
          >
            <TriangleAlert class="size-4 shrink-0" aria-hidden="true" />{{
              $t('contests.best.frozen', { time: formatDate(frozenAt, 'datetime', locale.locale) })
            }}
          </p>
          <EmptyState v-if="!list?.items.length">{{ $t('submissions.best.empty') }}</EmptyState>
          <template v-else>
            <SubmissionTable
              :submissions="rows"
              :show-problem="false"
              :rank-start="rankStart"
              :own-username="session.user?.username"
            />
            <NumberedPager :meta="list.meta" :label="$t('submissions.best.pager')" />
          </template>
          <p
            class="flex items-center gap-2.5 border-t border-line px-5 py-2.5 text-caption text-muted"
          >
            <Info class="size-4 shrink-0" aria-hidden="true" />{{ $t('contests.best.rule') }}
          </p>
        </Card>
      </QueryState>
    </template>
  </div>
</template>
