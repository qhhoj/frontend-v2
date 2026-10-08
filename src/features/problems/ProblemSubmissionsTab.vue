<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import GlassCard from '@/components/GlassCard.vue';
import QueryState from '@/components/QueryState.vue';
import SubmissionTable from '@/features/submissions/SubmissionTable.vue';
import SubmissionTableSkeleton from '@/features/submissions/SubmissionTableSkeleton.vue';
import { useSubmissionListQuery } from '@/features/submissions/submissions.queries';
import type { SubmissionFilters } from '@/features/submissions/use-submission-filters';
import { safeRedirect } from '@/router/safe-redirect';
import { useSessionStore } from '@/stores/session.store';
import SubmitSignInLink from './SubmitSignInLink.vue';

/** The viewer's own submissions to this problem, newest first. Mounted only while its tab is selected. */
const props = defineProps<{ code: string }>();
const route = useRoute();
const session = useSessionStore();
const username = computed(() => session.user?.username ?? '');
const isSignedIn = computed(() => session.status === 'authenticated');
const filters = computed<SubmissionFilters>(() => ({
  problem: props.code,
  user: username.value,
  results: [],
  languageIds: [],
  page: 1,
  live: false,
}));
const { data: list, isPending, error, refetch } = useSubmissionListQuery(filters, isSignedIn);
const signInTarget = computed(() => ({
  path: '/login',
  query: { redirect: safeRedirect(route.fullPath) },
}));
</script>

<template>
  <GlassCard v-if="!isSignedIn" as="div" class="p-4">
    <SubmitSignInLink :to="signInTarget" />
  </GlassCard>
  <QueryState v-else :loading="isPending" :error="error" @retry="refetch()">
    <template #skeleton><SubmissionTableSkeleton :show-problem="false" /></template>
    <GlassCard v-if="!list?.items.length" as="div" class="px-6 py-10 text-center text-muted">
      {{ $t('problem.noSubmissions') }}
    </GlassCard>
    <SubmissionTable v-else :submissions="list.items" :show-problem="false" />
    <RouterLink
      :to="{ name: 'submissions', query: { problem: code } }"
      class="mt-3 inline-flex min-h-11 items-center text-accent-text hover:underline"
      >{{ $t('common.viewAll') }}</RouterLink
    >
  </QueryState>
</template>
