<script setup lang="ts">
import { computed } from 'vue';
import EmptyState from '@/components/EmptyState.vue';
import GlassCard from '@/components/GlassCard.vue';
import QueryState from '@/components/QueryState.vue';
import SubmissionTable from '@/features/submissions/SubmissionTable.vue';
import SubmissionTableSkeleton from '@/features/submissions/SubmissionTableSkeleton.vue';
import { useSubmissionListQuery } from '@/features/submissions/submissions.queries';
import type { SubmissionFilters } from '@/features/submissions/use-submission-filters';
import { useSessionStore } from '@/stores/session.store';
import SubmitSignInLink from './SubmitSignInLink.vue';

/** The viewer's own submissions to this problem, newest first. Mounted only while its tab is selected. */
const props = defineProps<{ code: string }>();
const session = useSessionStore();
const username = computed(() => session.user?.username ?? '');
const isSignedIn = computed(() => session.status === 'authenticated');
const filters = computed<SubmissionFilters>(() => ({
  problem: props.code,
  user: username.value,
  results: [],
  languageIds: [],
  statusGroups: [],
  page: 1,
  live: false,
}));
const { data: list, isPending, error, refetch } = useSubmissionListQuery(filters, isSignedIn);
</script>

<template>
  <GlassCard v-if="!isSignedIn" as="div" class="p-4">
    <SubmitSignInLink />
  </GlassCard>
  <QueryState v-else :loading="isPending" :error="error" @retry="refetch()">
    <template #skeleton><SubmissionTableSkeleton :show-problem="false" /></template>
    <GlassCard v-if="!list?.items.length" as="div">
      <EmptyState>{{ $t('problem.noSubmissions') }}</EmptyState>
    </GlassCard>
    <SubmissionTable v-else :submissions="list.items" :show-problem="false" />
    <RouterLink
      :to="{ name: 'submissions', query: { problem: code, user: username } }"
      class="mt-3 inline-flex min-h-11 items-center text-accent-text hover:underline"
      >{{ $t('common.viewAll') }}</RouterLink
    >
  </QueryState>
</template>
