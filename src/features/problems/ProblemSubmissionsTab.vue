<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import SubmissionList from '@/features/submissions/list/SubmissionList.vue';
import type { SubmissionScope } from '@/features/submissions/list/submission-scope';
import { useSessionStore } from '@/stores/session.store';

/**
 * The problem page's "Bài nộp" tab (`/problems/:code/submissions`) and "Của tôi" tab (`/problems/:code/mine`): the
 * submission list pinned to this problem, and for "Của tôi" to the signed-in viewer. The problem page draws the header and
 * the tabs.
 */
const props = defineProps<{ mine?: boolean }>();
const route = useRoute();
const session = useSessionStore();
const username = computed(() => (props.mine ? (session.user?.username ?? null) : null));
const scope = computed<SubmissionScope>(() => ({
  kind: 'global',
  fixedProblem: String(route.params.code),
  ...(username.value ? { fixedUser: username.value } : {}),
}));
/** "Của tôi" waits for the viewer's name: without it the list would show everyone's. */
const isReady = computed(() => !props.mine || username.value !== null);
</script>

<template>
  <SubmissionList
    :scope="scope"
    :enabled="isReady"
    :empty-key="mine ? 'problem.noSubmissions' : 'submissions.empty'"
    class="mt-4"
  />
</template>
