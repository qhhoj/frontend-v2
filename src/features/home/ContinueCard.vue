<script setup lang="ts">
import { computed } from 'vue';
import type { SubmissionListItem } from '@/api/types/submissions';
import EmptyState from '@/components/EmptyState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import Card from '@/components/ui/Card.vue';
import { CUE_TEXT } from '@/components/ui/cue-tones';
import Lamp from '@/components/ui/Lamp.vue';
import AppButton from '@/components/ui/AppButton.vue';
import StretchedLink from '@/components/ui/StretchedLink.vue';
import { scoreCue, scoreText } from '@/features/submissions/submission-row';
import { submissionVerdictOf, verdictOfCode } from '@/lib/verdicts';
import { useLocaleStore } from '@/stores/locale.store';
import { useProblemMapQuery, useRecentSubmissionsQuery } from './home.queries';
import ProblemProgress from './ProblemProgress.vue';
import { unfinishedProblems } from './unfinished-problems';
import type { UnfinishedProblem } from './unfinished-problems';

/**
 * "Làm tiếp": the problems the viewer tried and has not solved (lamp, name, best score), each row a link as a whole,
 * then the progress over the catalogue. The rows come from the query "Bài nộp gần đây" reads, so they add no request;
 * the catalogue (one request) also tells which of them were solved before. A catalogue larger than one page has no map.
 */
const ROWS = 3;
const PROBLEMS = { name: 'problems' };
const props = defineProps<{ username: string }>();
const { data: submissions, isPending } = useRecentSubmissionsQuery(() => props.username);
const { data: catalogue, isPending: isCataloguePending } = useProblemMapQuery();
const locale = useLocaleStore();

const problems = computed(() => catalogue.value?.items ?? []);
const hasWholeCatalogue = computed(
  () => catalogue.value !== undefined && catalogue.value.meta.total <= problems.value.length,
);
const solvedCodes = computed(
  () =>
    new Set(
      problems.value
        .filter((problem) => problem.viewerStatus === 'solved')
        .map((problem) => problem.code),
    ),
);
const rows = computed(() => unfinishedProblems(submissions.value ?? [], solvedCodes.value, ROWS));
/** The lamp says how far the best try got: a partial score is the partial verdict, whatever stopped it; else its own verdict. */
const verdictOf = ({ submission }: UnfinishedProblem) =>
  scoreCue(submission, undefined) === 'partial'
    ? verdictOfCode('PC')
    : submissionVerdictOf(submission);
const scoreClass = (item: SubmissionListItem) => {
  const cue = scoreCue(item, undefined);
  return cue ? CUE_TEXT[cue] : 'text-muted';
};
</script>

<template>
  <Card data-testid="continue-card" :title="$t('home.continue.title')" padding="md">
    <template v-if="isPending || rows.length" #actions>
      <AppButton tone="link" class="text-meta" :to="PROBLEMS">{{
        $t('home.continue.all')
      }}</AppButton>
    </template>
    <ul v-if="isPending" aria-hidden="true" class="flex flex-col divide-y divide-line">
      <li v-for="row in ROWS" :key="row" class="flex min-h-(--qh-row) items-center gap-3 px-2">
        <span class="min-w-0 flex-1"><SkeletonBlock text class="w-1/2" /></span>
        <SkeletonBlock text class="w-16" />
      </li>
    </ul>
    <ul v-else-if="rows.length" class="flex flex-col divide-y divide-line">
      <li
        v-for="problem in rows"
        :key="problem.code"
        data-testid="continue-problem"
        class="box-link flex min-h-(--qh-row) items-center gap-3 px-2 touch:min-h-13"
      >
        <Lamp :tone="verdictOf(problem).tone" :label="$t(verdictOf(problem).labelKey)" />
        <StretchedLink
          :to="{ name: 'problem', params: { code: problem.code } }"
          class="min-w-0 flex-1 truncate font-medium text-content"
          >{{ problem.name }}</StretchedLink
        >
        <span
          class="shrink-0 font-mono text-small tabular-nums"
          :class="scoreClass(problem.submission)"
          >{{ scoreText(problem.submission, locale.locale, true) }}</span
        >
      </li>
    </ul>
    <EmptyState v-else inline>
      {{ $t('home.continue.empty') }}
      <template #action>
        <AppButton tone="link" class="text-meta" :to="PROBLEMS">{{
          $t('home.anon.problems')
        }}</AppButton>
      </template>
    </EmptyState>
    <ProblemProgress
      v-if="isCataloguePending || hasWholeCatalogue"
      :problems="problems"
      :loading="isCataloguePending"
      class="mt-4"
    />
  </Card>
</template>
