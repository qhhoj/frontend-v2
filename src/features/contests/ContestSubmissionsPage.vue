<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { ApiError } from '@/api/client';
import SubmitSignInLink from '@/features/problems/SubmitSignInLink.vue';
import SubmissionList from '@/features/submissions/list/SubmissionList.vue';
import type { ProblemPickerSource } from '@/features/submissions/list/problem-picker-options';
import type { SubmissionScope } from '@/features/submissions/list/submission-scope';
import type { ColumnKey } from '@/features/submissions/submission-table-cells';
import { useNow } from '@/lib/use-now';
import { usePageTitle } from '@/router/page-title';
import { useSessionStore } from '@/stores/session.store';
import ContestCompactHeader from './ContestCompactHeader.vue';
import ContestNotFound from './ContestNotFound.vue';
import ContestTabs from './ContestTabs.vue';
import { useContestQuery } from './contests.queries';
import { ownSubmissionsOnly } from './own-submissions';

/** The narrowed list's columns (the score is in the verdict block): every row is the viewer's own, so user, language and cost add nothing. */
const OWN_ONLY_COLUMNS: readonly ColumnKey[] = ['verdict', 'problem', 'when'];

const route = useRoute();
const session = useSessionStore();
const key = computed(() => String(route.params.key));
const { data: contest, error: contestError } = useContestQuery(key);
const now = useNow(30_000);
const isOwnOnly = computed(() =>
  contest.value ? ownSubmissionsOnly(contest.value, now.value) : false,
);
/** A visitor on a narrowed list would get a 403: ask them to sign in instead. */
const canAsk = computed(() => Boolean(contest.value) && !(isOwnOnly.value && !session.user));
const scope = computed<SubmissionScope>(() => ({
  kind: 'contest',
  key: key.value,
  fixedUser: isOwnOnly.value ? (session.user?.username ?? null) : null,
}));
const problemSource = computed<ProblemPickerSource>(() => ({
  kind: 'contest',
  problems: contest.value?.problems ?? [],
}));
const labels = computed(() =>
  Object.fromEntries(
    (contest.value?.problems ?? []).map((problem) => [problem.code, problem.label]),
  ),
);
const isMissing = computed(
  () => contestError.value instanceof ApiError && contestError.value.status === 404,
);
usePageTitle(() => contest.value?.name);
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
      <SubmissionList
        v-if="canAsk"
        :scope="scope"
        :problem-source="problemSource"
        :column-keys="isOwnOnly ? OWN_ONLY_COLUMNS : undefined"
        :problem-labels="labels"
        show-status-groups
        empty-key="contests.submissions.empty"
      />
    </template>
  </div>
</template>
