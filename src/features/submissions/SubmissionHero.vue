<script setup lang="ts">
import { Send } from 'lucide-vue-next';
import { computed } from 'vue';
import { FINISHED_STATUSES, IN_PROGRESS_STATUSES } from '@/api/types/submissions';
import type { SubmissionDetail } from '@/api/types/submissions';
import AppButton from '@/components/ui/AppButton.vue';
import Card from '@/components/ui/Card.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import VerdictLabel from '@/components/VerdictLabel.vue';
import { translate } from '@/i18n';
import { formatNumber } from '@/lib/format';
import { provisionalPoints, ringProgress } from '@/lib/grading';
import { PARTIAL_CODE, verdictOfCode, type Verdict } from '@/lib/verdicts';
import { useLocaleStore } from '@/stores/locale.store';
import { heroParts } from './hero-line';
import VerdictRing from './VerdictRing.vue';

/** Two decimals like the problem header; no digit grouping, scores are read as plain numbers. */
const SCORE_FRACTION_DIGITS = 2;
const NO_VALUE = '—';

/**
 * The result at a glance (P-11): the 72 px ring, the verdict and score on one line, the failing test, the passed count, time,
 * memory and language on the next, and what to do now: "Nộp lại" for the author, "Về đề bài" for everyone (the primary
 * action when there is nothing to resubmit). Keep `SubmissionHeroSkeleton.vue` in step.
 */
const props = defineProps<{
  submission: SubmissionDetail;
  verdict: Verdict;
  /** The problem's points when it is readable. */
  problemPoints: number | null;
  /** The problem is still loading: only the score waits for it. */
  isProblemLoading: boolean;
  /** The stream is open and the grading is going on. */
  isLive: boolean;
  /** Only the author resubmits; never to a deleted problem. */
  canResubmit: boolean;
}>();
const locale = useLocaleStore();
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
const isFinished = computed(() => FINISHED_STATUSES.includes(props.submission.status));
/** A partially correct score fills the ring by its share of the problem's points. */
const partialShare = computed(() => {
  const max = props.submission.problem?.points;
  if (props.verdict.code !== PARTIAL_CODE || !max || props.submission.points === null) return null;
  return props.submission.points / max;
});
const line = computed(() =>
  heroParts(props.submission)
    .map((part) => {
      if ('text' in part) return part.text;
      if (part.key === 'passed') return translate('submission.overview.allPassed', part.values);
      const verdict = translate(verdictOfCode(part.values.status).labelKey);
      return translate('submission.overview.failed', {
        number: part.values.number,
        verdict: verdict.toLocaleLowerCase(locale.locale),
      });
    })
    .join(' · '),
);
const problem = computed(() => {
  const row = props.submission.problem;
  return row && !row.isDeleted ? row.code : null;
});
</script>

<template>
  <Card
    as="div"
    data-testid="submission-hero"
    class="flex flex-wrap items-center gap-x-5 gap-y-4 rounded-card p-5 sm:px-6"
  >
    <VerdictRing
      :progress="isFinished ? null : ringProgress(submission)"
      :verdict="verdict"
      :share="partialShare"
      :is-empty="submission.status === 'PD'"
    />
    <div class="min-w-0 flex-1 basis-40">
      <p class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span v-if="isLive" data-testid="grading-line" class="flex items-center gap-2 text-sm">
          <span
            aria-hidden="true"
            class="size-2.5 rounded-full bg-positive motion-safe:animate-pulse"
          />
          {{ $t(verdict.labelKey) }}
        </span>
        <VerdictLabel v-else :verdict="verdict" />
        <span
          data-testid="score"
          class="font-mono text-stat leading-none font-semibold whitespace-nowrap tabular-nums"
        >
          <SkeletonBlock v-if="isProblemLoading" text class="w-24" />
          <template v-else
            >{{ score
            }}<span v-if="maxScore" class="text-sm text-muted"> / {{ maxScore }}</span></template
          >
        </span>
        <span v-if="isProvisional" data-testid="provisional" class="text-meta text-muted">
          {{ $t('submission.provisional') }}
        </span>
      </p>
      <p v-if="line" data-testid="hero-line" class="mt-1.5 text-meta text-muted">{{ line }}</p>
      <p v-if="submission.isPretested" class="mt-1 text-meta text-muted">
        {{ $t('submission.pretest') }}
      </p>
    </div>
    <div v-if="problem" class="flex flex-wrap gap-2 sm:ml-auto">
      <AppButton
        :tone="canResubmit ? 'secondary' : 'primary'"
        :to="{ name: 'problem', params: { code: problem } }"
      >
        {{ $t('submission.actions.problem') }}
      </AppButton>
      <AppButton
        v-if="canResubmit"
        tone="primary"
        :to="{ name: 'problem', params: { code: problem }, query: { resubmit: submission.id } }"
      >
        <template #icon><Send aria-hidden="true" class="size-4" /></template>
        {{ $t('submission.actions.resubmit') }}
      </AppButton>
    </div>
  </Card>
</template>
