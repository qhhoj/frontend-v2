<script setup lang="ts">
import { Lock } from 'lucide-vue-next';
import Notice from '@/components/ui/Notice.vue';
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { ApiError } from '@/api/client';
import SubmitSignInLink from '@/features/problems/SubmitSignInLink.vue';
import SubmissionList from '@/features/submissions/list/SubmissionList.vue';
import type { ProblemPickerSource } from '@/features/submissions/list/problem-picker-options';
import type { SubmissionScope } from '@/features/submissions/list/submission-scope';
import { useNow } from '@/lib/use-now';
import { usePageTitle } from '@/router/page-title';
import { useSessionStore } from '@/stores/session.store';
import ContestCompactHeader from './ContestCompactHeader.vue';
import ContestNotFound from './ContestNotFound.vue';
import ContestSubmissionChips from './ContestSubmissionChips.vue';
import ContestTabs from './ContestTabs.vue';
import { useContestQuery } from './contests.queries';
import { ownSubmissionsOnly } from './own-submissions';

const route = useRoute();
const session = useSessionStore();
const key = computed(() => String(route.params.key));
const { data: contest, error: contestError } = useContestQuery(key);
const now = useNow(30_000);
const isOwnOnly = computed(() =>
  contest.value ? ownSubmissionsOnly(contest.value, now.value) : false,
);
/** A visitor on a narrowed list would get a 403: the notice asks them to sign in instead. */
const isVisitorOnOwnList = computed(() => isOwnOnly.value && !session.user);
const canAsk = computed(() => Boolean(contest.value) && !isVisitorOnOwnList.value);
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
      <div
        v-if="isOwnOnly && !isVisitorOnOwnList"
        data-testid="own-only"
        class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1"
      >
        <h2 class="font-display text-lg font-bold">
          {{ $t('contests.submissions.ownHeading') }}
        </h2>
        <p
          class="flex items-center gap-1.5 text-meta text-muted"
          :title="$t('contests.submissions.ownOnlyBody')"
        >
          <Lock class="size-3.5" aria-hidden="true" />{{ $t('contests.submissions.onlyYou') }}
          <span class="sr-only">{{ $t('contests.submissions.ownOnlyBody') }}</span>
        </p>
      </div>
      <Notice
        v-else-if="isVisitorOnOwnList"
        data-testid="own-only"
        :title="$t('contests.submissions.ownOnlyTitle')"
      >
        {{ $t('contests.submissions.ownOnlyBody') }}
        <template #action>
          <SubmitSignInLink label-key="contests.submissions.signIn" />
        </template>
      </Notice>
      <SubmissionList
        v-if="canAsk"
        :scope="scope"
        :problem-source="problemSource"
        :problem-labels="labels"
        :show-stats="false"
        ledger
        :advanced-filters="!isOwnOnly"
        problem-by-chip
        show-status-groups
        empty-key="contests.submissions.empty"
      >
        <template #filters="{ filters, update, advanced, toggleAdvanced }">
          <ContestSubmissionChips
            :filters="filters"
            :problems="contest?.problems ?? []"
            :advanced="advanced"
            @update="update"
            @toggle-advanced="toggleAdvanced"
          />
        </template>
      </SubmissionList>
    </template>
  </div>
</template>
