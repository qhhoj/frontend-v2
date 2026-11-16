<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import EmptyState from '@/components/EmptyState.vue';
import AppButton from '@/components/ui/AppButton.vue';
import Card from '@/components/ui/Card.vue';
import NumberedPager from '@/components/NumberedPager.vue';
import PageOutOfRange from '@/components/PageOutOfRange.vue';
import QueryState from '@/components/QueryState.vue';
import SubmissionTable from '@/features/submissions/SubmissionTable.vue';
import SubmissionTableSkeleton from '@/features/submissions/SubmissionTableSkeleton.vue';
import { SUBMISSION_PAGE_SIZE } from '@/features/submissions/list/submission-scope';
import { useBestSubmissionsQuery } from '@/features/submissions/submissions.queries';
import { pageFromQuery } from '@/lib/paging';

/**
 * The problem page's "Tốt nhất" tab (`/problems/:code/best`): each user's best submission, ranked (points, time, memory,
 * earliest), `?page=` paged. The problem page draws the header and the tabs; a problem that does not exist never gets here.
 */
const route = useRoute();
const code = computed(() => String(route.params.code));
const page = computed(() => pageFromQuery(route.query.page));
const { data: list, isPending, error, refetch } = useBestSubmissionsQuery(code, page);
/** The empty list's next step: back to the statement, keeping the contest the visitor came from. */
const statementTo = computed(() => ({
  name: 'problem',
  params: { code: code.value },
  query: route.query.contest ? { contest: route.query.contest } : {},
}));
const rankStart = computed(() => ((list.value?.meta.page ?? 1) - 1) * SUBMISSION_PAGE_SIZE + 1);
</script>

<template>
  <div class="mt-4 flex min-w-0 flex-col gap-3">
    <p class="text-meta text-muted">{{ $t('submissions.best.lead') }}</p>
    <QueryState :loading="isPending" :error="error" @retry="refetch()">
      <template #skeleton><SubmissionTableSkeleton :show-problem="false" /></template>
      <Card v-if="!list?.items.length" as="div">
        <PageOutOfRange v-if="list && list.meta.page > 1" :meta="list.meta" :row-count="0" />
        <EmptyState v-else>
          {{ $t('submissions.best.empty') }}
          <template #action>
            <AppButton :to="statementTo">{{ $t('problem.tabs.statement') }}</AppButton>
          </template>
        </EmptyState>
      </Card>
      <template v-else>
        <SubmissionTable :submissions="list.items" :show-problem="false" :rank-start="rankStart" />
        <NumberedPager :meta="list.meta" :label="$t('submissions.best.pager')" />
      </template>
    </QueryState>
  </div>
</template>
