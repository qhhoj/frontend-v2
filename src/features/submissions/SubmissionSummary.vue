<script setup lang="ts">
import { computed } from 'vue';
import { FINISHED_STATUSES, IN_PROGRESS_STATUSES } from '@/api/types/submissions';
import type { SubmissionDetail } from '@/api/types/submissions';
import GlassCard from '@/components/GlassCard.vue';
import UserName from '@/components/UserName.vue';
import VerdictLabel from '@/components/VerdictLabel.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import {
  formatCaseMemory,
  formatCaseTime,
  formatDateTime,
  formatNumber,
  formatRelative,
} from '@/lib/format';
import { provisionalPoints, ringProgress } from '@/lib/grading';
import type { Verdict } from '@/lib/verdicts';
import { useNow } from '@/lib/use-now';
import { useLocaleStore } from '@/stores/locale.store';
import VerdictRing from './VerdictRing.vue';

/** Two decimals like the problem header; no digit grouping, scores are read as plain numbers. */
const SCORE_FRACTION_DIGITS = 2;
const NO_VALUE = '—';
/** "3 minutes ago" only needs a fresh clock once a minute. */
const CLOCK_REFRESH_MS = 60_000;

/** Keep `SubmissionSummarySkeleton.vue` in step: same cards, grid and text classes. */
const props = defineProps<{
  submission: SubmissionDetail;
  verdict: Verdict;
  /** The problem's name and points when it is readable; the row's own name is the fallback. */
  problemName: string | null;
  problemPoints: number | null;
  /** The problem is still loading: only the points cell waits for it. */
  isProblemLoading: boolean;
  /** The stream is open and the grading is going on. */
  isLive: boolean;
}>();
const locale = useLocaleStore();
const now = useNow(CLOCK_REFRESH_MS);
const format = (points: number) =>
  formatNumber(points, locale.locale, SCORE_FRACTION_DIGITS, false);

/** A row still in progress has no final points: the share of the case points stands in for them. */
const isProvisional = computed(() => IN_PROGRESS_STATUSES.includes(props.submission.status));
const score = computed(() => {
  if (isProvisional.value)
    return props.problemPoints === null
      ? NO_VALUE
      : format(provisionalPoints(props.problemPoints, props.submission));
  return props.submission.points === null ? NO_VALUE : format(props.submission.points);
});
const maxScore = computed(() =>
  !isProvisional.value && props.submission.points !== null && props.problemPoints !== null
    ? format(props.problemPoints)
    : null,
);
const runtime = computed(() =>
  props.submission.time === null || props.submission.memory === null
    ? NO_VALUE
    : `${formatCaseTime(props.submission.time)} · ${formatCaseMemory(props.submission.memory)}`,
);
const isFinished = computed(() => FINISHED_STATUSES.includes(props.submission.status));
const facts = computed(() => [
  { key: 'language', value: props.submission.language?.name ?? NO_VALUE },
  { key: 'runtime', value: runtime.value },
  { key: 'judge', value: props.submission.judgedOn ?? NO_VALUE },
]);
</script>

<template>
  <div
    data-testid="submission-summary"
    class="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"
  >
    <GlassCard
      as="div"
      class="flex flex-wrap items-center gap-x-6 gap-y-4 rounded-panel p-6 sm:p-8"
    >
      <VerdictRing
        :progress="isFinished ? null : ringProgress(submission)"
        :verdict="verdict"
        :is-empty="submission.status === 'PD'"
      />
      <div class="min-w-0 flex-1 basis-40">
        <p v-if="isLive" data-testid="grading-line" class="flex items-center gap-2 text-sm">
          <span
            aria-hidden="true"
            class="size-2.5 rounded-full bg-positive motion-safe:animate-pulse"
          />
          {{ $t(verdict.labelKey) }}
        </p>
        <p v-else class="text-sm"><VerdictLabel :verdict="verdict" /></p>
        <p
          data-testid="score"
          class="mt-1 font-mono text-[56px] leading-none font-semibold tabular-nums"
        >
          <SkeletonBlock v-if="isProblemLoading" text class="w-40" />
          <template v-else
            >{{ score
            }}<span v-if="maxScore" class="text-2xl whitespace-nowrap text-muted">
              / {{ maxScore }}</span
            ></template
          >
        </p>
        <p v-if="isProvisional" data-testid="provisional" class="text-[13px] text-muted">
          {{ $t('submission.provisional') }}
        </p>
      </div>
    </GlassCard>
    <GlassCard as="div" class="rounded-panel p-6 sm:p-8">
      <dl class="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-[15px]">
        <dt class="text-[13px] text-muted">{{ $t('submission.facts.problem') }}</dt>
        <dd class="min-w-0 [overflow-wrap:anywhere]">
          <RouterLink
            v-if="submission.problem"
            :to="{ name: 'problem', params: { code: submission.problem.code } }"
            class="font-semibold hover:underline"
            >{{ problemName ?? submission.problem.name }}</RouterLink
          ><template v-else>{{ NO_VALUE }}</template>
        </dd>
        <dt class="text-[13px] text-muted">{{ $t('submission.facts.user') }}</dt>
        <dd class="min-w-0 [overflow-wrap:anywhere]">
          <UserName v-if="submission.user" :username="submission.user.username" /><template
            v-else
            >{{ NO_VALUE }}</template
          >
        </dd>
        <dt class="text-[13px] text-muted">{{ $t('submission.facts.submitted') }}</dt>
        <dd class="min-w-0">
          <time
            :datetime="submission.date"
            :title="formatDateTime(submission.date, locale.locale)"
            >{{ formatRelative(submission.date, now, locale.locale) }}</time
          >
        </dd>
        <template v-for="fact in facts" :key="fact.key">
          <dt class="text-[13px] text-muted">{{ $t(`submission.facts.${fact.key}`) }}</dt>
          <dd class="min-w-0 font-mono [overflow-wrap:anywhere]">{{ fact.value }}</dd>
        </template>
      </dl>
      <p v-if="submission.isPretested" class="mt-4 text-[13px] text-muted">
        {{ $t('submission.pretest') }}
      </p>
    </GlassCard>
  </div>
</template>
