<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { FINISHED_STATUSES, IN_PROGRESS_STATUSES } from '@/api/types/submissions';
import type { SubmissionDetail } from '@/api/types/submissions';
import type { ProblemDetail } from '@/api/types/problems';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import Disclosure from '@/components/ui/Disclosure.vue';
import Gauge from '@/components/ui/Gauge.vue';
import Readout from '@/components/ui/Readout.vue';
import ReadoutCell from '@/components/ui/ReadoutCell.vue';
import TestSquares, { type TestSquare } from '@/components/ui/TestSquares.vue';
import { translate } from '@/i18n';
import {
  NO_VALUE,
  formatCaseMemory,
  formatCaseTime,
  formatMemoryLimit,
  formatPoints,
  formatTimeLimit,
  scoreBelowFull,
} from '@/lib/format';
import { provisionalPoints } from '@/lib/grading';
import { caseVerdictOf } from '@/lib/verdicts';
import type { Verdict } from '@/lib/verdicts';
import { useLocaleStore } from '@/stores/locale.store';
import { ERROR_RESULTS } from './quick-filters';
import {
  INLINE_SQUARES_MAX,
  firstFailedCase,
  limitsFor,
  passedCount,
  peakOf,
  plateSquares,
} from './submission-plate';

/** Two decimals like the problem header; no digit grouping, scores are read as plain numbers. */
const SCORE_FRACTION_DIGITS = 2;

/**
 * The verdict plate: what the judge measured for one submission. The verdict as a sentence that names the first failing
 * test, the score, a square per test (per subtask when there are very many), and the slowest test and the largest
 * memory against the limits they ran under. While the judge runs, the sentence counts the tests and the squares light
 * up as results arrive. A compile error and a system error use the same plate: the sentence, then the output in a fold.
 * Only what the API gives is shown: no gauge without a readable limit, no squares without test results.
 * Keep `SubmissionPlateSkeleton.vue` in step.
 */
const props = defineProps<{
  submission: SubmissionDetail;
  verdict: Verdict;
  /** The problem, when this viewer can read it: its points and limits. */
  problem: ProblemDetail | undefined;
  /** The problem is still loading: only the score waits for it. */
  isProblemLoading: boolean;
  /** The stream is open and the grading is going on. */
  isLive: boolean;
  /** The test the judge is on, from the live stream (0 when unknown). */
  currentTestcase: number;
  /** A judged contest submission: the contest points lead, the problem's score is the line under them. */
  contestScore?: { points: string; max: string } | null;
  /** The page has no tests table under the plate (the problem workbench): a square opens nothing. */
  withoutTestRows?: boolean;
}>();
const locale = useLocaleStore();
const format = (points: number) => formatPoints(points, locale.locale, SCORE_FRACTION_DIGITS);
const problemPoints = computed(() => props.problem?.points ?? null);

/** A row still in progress has no final points: the share of the case points stands in for them. */
const isProvisional = computed(() => IN_PROGRESS_STATUSES.includes(props.submission.status));
const isFinished = computed(() => FINISHED_STATUSES.includes(props.submission.status));
const score = computed(() => {
  if (isProvisional.value)
    return problemPoints.value === null
      ? NO_VALUE
      : format(provisionalPoints(problemPoints.value, props.submission));
  return props.submission.points === null
    ? NO_VALUE
    : format(scoreBelowFull(props.submission.points, problemPoints.value, SCORE_FRACTION_DIGITS));
});
const maxScore = computed(() =>
  !isProvisional.value && props.submission.points !== null && problemPoints.value !== null
    ? format(problemPoints.value)
    : null,
);
/** The score cell: the contest's points in a contest (the problem's own score under them), else the problem's. */
const scoreCell = computed(() => {
  if (props.contestScore)
    return {
      label: translate('submission.plate.contestScore'),
      value: props.contestScore.points,
      max: props.contestScore.max,
      note: maxScore.value
        ? translate('submission.contest.problemScore', { score: score.value, max: maxScore.value })
        : null,
    };
  return {
    label: translate(
      isProvisional.value ? 'submission.plate.provisional' : 'submission.plate.score',
    ),
    value: score.value,
    max: maxScore.value,
    note: null,
  };
});

/** Judged to the end with a result that is the program's fault: only then does a failing test explain the verdict (not for a rejected or aborted submission). */
const isJudgedWrong = computed(() => {
  const { status, result } = props.submission;
  return status === 'D' && result !== null && ERROR_RESULTS.includes(result);
});
/**
 * "Quá thời gian ở test 8": the first failing test by its own status, in that status's colour; while judging,
 * "Đang chấm test 4/10"; otherwise the verdict's own name.
 */
const sentence = computed(() => {
  const total = props.submission.totalCases;
  const tone = props.verdict.tone;
  if (props.isLive && props.submission.status === 'G' && props.currentTestcase > 0 && total)
    return {
      tone,
      text: translate('submission.plate.judging', { current: props.currentTestcase, total }),
    };
  const failed = isJudgedWrong.value ? firstFailedCase(props.submission.cases) : null;
  if (!failed) return { tone, text: translate(props.verdict.labelKey) };
  const failedVerdict = caseVerdictOf(failed);
  return {
    tone: failedVerdict.tone,
    text: translate('submission.plate.failedAt', {
      verdict: translate(failedVerdict.labelKey),
      number: failed.position,
    }),
  };
});

const tests = computed(() => plateSquares(props.submission, props.isLive, locale.locale));
const passed = computed(() => passedCount(props.submission));
const hasTestsCell = computed(() => tests.value !== null || passed.value !== null);
/** Many squares leave the row of readings and wrap on a line of their own under it. */
const isWideTests = computed(() => (tests.value?.squares.length ?? 0) > INLINE_SQUARES_MAX);
/** A square that has a row in the tests table opens that row (`#case-<n>`, which `CasesTable.vue` follows). */
const router = useRouter();
const hasTestRows = computed(
  () => !props.withoutTestRows && tests.value?.unit === 'test' && props.submission.cases !== null,
);
function openTestRow(square: TestSquare) {
  if (square.number === undefined) return;
  void router.replace({ hash: `#case-${square.number}` });
}

const peak = computed(() => (isFinished.value ? peakOf(props.submission.cases) : null));
const limits = computed(() => limitsFor(props.problem, props.submission.language?.key ?? null));
/** A reading against its limit; without visible tests the row's own figure, which no limit applies to as a whole. */
const cost = computed(() => {
  if (!isFinished.value) return null;
  const time = peak.value?.time ?? props.submission.time;
  const memory = peak.value?.memory ?? props.submission.memory;
  const withLimit = peak.value !== null && limits.value !== null ? limits.value : null;
  return {
    time:
      time === null
        ? null
        : {
            label: translate(peak.value ? 'submission.plate.slowest' : 'submission.cases.time'),
            value: time,
            text: formatCaseTime(time),
            limit: withLimit?.time ?? null,
            limitText: withLimit ? formatTimeLimit(withLimit.time) : '',
          },
    memory:
      memory === null
        ? null
        : {
            label: translate(peak.value ? 'submission.plate.largest' : 'submission.cases.memory'),
            value: memory,
            text: formatCaseMemory(memory),
            limit: withLimit?.memory ?? null,
            limitText: withLimit ? formatMemoryLimit(withLimit.memory) : '',
          },
  };
});
const gauges = computed(() =>
  [cost.value?.time, cost.value?.memory].flatMap((reading) => (reading ? [reading] : [])),
);

const isCompileError = computed(() => props.submission.status === 'CE');
const isInternalError = computed(() => props.submission.status === 'IE');
/** The compiler's output is the answer to a compile error: it starts open. */
const isCompileLogOpen = ref(true);
const isStaffMessageOpen = ref(false);
</script>

<template>
  <Readout data-testid="submission-hero" :label="$t('submission.plate.label')">
    <div class="flex flex-wrap items-start gap-x-6 gap-y-4">
      <ReadoutCell
        :label="$t('submission.plate.verdict')"
        size="word"
        :tone="sentence.tone"
        class="flex-1 basis-64 max-sm:basis-full"
      >
        <span :data-testid="isLive ? 'grading-line' : 'verdict-name'">{{ sentence.text }}</span>
      </ReadoutCell>
      <ReadoutCell
        v-if="!isCompileError && !isInternalError"
        :label="scoreCell.label"
        size="big"
        class="shrink-0 max-sm:basis-full"
      >
        <span data-testid="score">
          <SkeletonBlock v-if="isProblemLoading" text class="w-24" />
          <template v-else>{{ scoreCell.value }}</template>
        </span>
        <template v-if="!isProblemLoading && scoreCell.max" #unit>/{{ scoreCell.max }}</template>
        <template v-if="scoreCell.note" #below>
          <span class="text-small text-muted">{{ scoreCell.note }}</span>
        </template>
      </ReadoutCell>
      <ReadoutCell
        v-if="hasTestsCell"
        :label="$t(passed ? 'submission.plate.passed' : 'submission.plate.tests')"
        :class="isWideTests ? 'order-last basis-full' : 'max-w-64 shrink-0 max-sm:basis-full'"
      >
        <template v-if="passed">{{ passed.passed }}</template>
        <template v-if="passed" #unit>/{{ passed.total }}</template>
        <template v-if="tests" #below>
          <TestSquares
            data-testid="plate-squares"
            :tests="tests.squares"
            :selectable="hasTestRows"
            :label="
              $t(
                tests.unit === 'group'
                  ? 'submission.plate.groupSquares'
                  : 'submission.plate.squares',
              )
            "
            @select="openTestRow"
          />
        </template>
      </ReadoutCell>
      <!-- The two readings against a limit stay side by side: when the row is full they wrap as a pair. -->
      <div v-if="gauges.length" class="flex shrink-0 gap-6 max-sm:basis-full">
        <ReadoutCell
          v-for="reading in gauges"
          :key="reading.label"
          :label="reading.label"
          class="w-36 shrink-0 max-sm:w-auto max-sm:flex-1"
        >
          {{ reading.text }}
          <template v-if="reading.limit !== null" #below>
            <Gauge
              :value="reading.value"
              :limit="reading.limit"
              :warn="reading.value >= reading.limit"
              :label="reading.label"
              :value-text="
                $t('submission.plate.ofLimit', { value: reading.text, limit: reading.limitText })
              "
              :scale="['0', $t('submission.plate.limit', { limit: reading.limitText })]"
            />
          </template>
        </ReadoutCell>
      </div>
    </div>
    <p
      v-if="isInternalError || submission.isPretested || (isCompileError && !submission.error)"
      class="mt-4 flex flex-col gap-1 text-small text-muted"
    >
      <span v-if="isInternalError" data-testid="internal-error">{{
        $t('submission.internalError.notice')
      }}</span>
      <span v-if="isCompileError && !submission.error">{{
        $t('submission.cases.compileLogHidden')
      }}</span>
      <span v-if="submission.isPretested">{{ $t('submission.pretest') }}</span>
    </p>
    <Disclosure
      v-if="isCompileError && submission.error"
      v-model:open="isCompileLogOpen"
      :label="$t('submission.cases.compileLog')"
      class="mt-2"
    >
      <pre
        data-testid="compile-log"
        class="max-h-96 overflow-auto rounded-cell bg-surface-strong p-4 font-mono text-small leading-relaxed whitespace-pre"
        >{{ submission.error }}</pre>
    </Disclosure>
    <Disclosure
      v-if="isInternalError && submission.error"
      v-model:open="isStaffMessageOpen"
      :label="$t('submission.internalError.staffMessage')"
      class="mt-2"
    >
      <pre
        data-testid="internal-error-message"
        class="max-h-96 overflow-auto rounded-cell bg-surface-strong p-4 font-mono text-small leading-relaxed whitespace-pre-wrap wrap-anywhere"
        >{{ submission.error }}</pre>
    </Disclosure>
  </Readout>
</template>
