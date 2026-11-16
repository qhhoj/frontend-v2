<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import { ApiError } from '@/api/client';
import EmptyState from '@/components/EmptyState.vue';
import Card from '@/components/ui/Card.vue';
import PageHeader from '@/components/ui/PageHeader.vue';
import NumberedPager from '@/components/NumberedPager.vue';
import PageOutOfRange from '@/components/PageOutOfRange.vue';
import QueryState from '@/components/QueryState.vue';
import NotFoundPage from '@/features/not-found/NotFoundPage.vue';
import { useProblemQuery } from '@/features/problems/problems.queries';
import { pageFromQuery } from '@/lib/paging';
import { usePageTitle } from '@/router/page-title';
import { useLocaleStore } from '@/stores/locale.store';
import SubmissionTable from './SubmissionTable.vue';
import SubmissionTableSkeleton from './SubmissionTableSkeleton.vue';
import { SUBMISSION_PAGE_SIZE } from './list/submission-scope';
import { useBestSubmissionsQuery } from './submissions.queries';

/** A problem's best submissions: each user's best one, ranked (points, time, memory, earliest), `?page=` paged. */
const route = useRoute();
const { t } = useI18n();
const locale = useLocaleStore();
const code = computed(() => String(route.params.code));
const page = computed(() => pageFromQuery(route.query.page));
const { data: problem, error: problemError } = useProblemQuery(
  code,
  computed(() => locale.locale),
);
const { data: list, isPending, error, refetch } = useBestSubmissionsQuery(code, page);
const rankStart = computed(() => ((list.value?.meta.page ?? 1) - 1) * SUBMISSION_PAGE_SIZE + 1);
const problemCrumb = computed(() => ({
  label: problem.value?.name ?? code.value,
  to: { name: 'problem', params: { code: code.value } },
}));
/** The problem (or the list) does not exist: the page is the 404 page, whatever the other query says. */
const isNotFound = computed(() =>
  [problemError.value, error.value].some(
    (failure) => failure instanceof ApiError && failure.code === 'not_found',
  ),
);
usePageTitle(() => {
  if (isNotFound.value) return t('pages.notFound');
  return problem.value ? `${t('submissions.best.title')} · ${problem.value.name}` : null;
});
</script>

<template>
  <NotFoundPage v-if="isNotFound" />
  <div v-else class="page-column">
    <PageHeader
      :title="$t('submissions.best.title')"
      :lead="$t('submissions.best.lead')"
      :crumbs="[problemCrumb, { label: $t('submissions.best.title') }]"
      :back="problemCrumb"
    />
    <QueryState :loading="isPending" :error="error" @retry="refetch()">
      <template #skeleton><SubmissionTableSkeleton :show-problem="false" /></template>
      <Card v-if="!list?.items.length" as="div">
        <PageOutOfRange v-if="list && list.meta.page > 1" :meta="list.meta" :row-count="0" />
        <EmptyState v-else>{{ $t('submissions.best.empty') }}</EmptyState>
      </Card>
      <template v-else>
        <SubmissionTable :submissions="list.items" :show-problem="false" :rank-start="rankStart" />
        <NumberedPager :meta="list.meta" :label="$t('submissions.best.pager')" />
      </template>
    </QueryState>
  </div>
</template>
