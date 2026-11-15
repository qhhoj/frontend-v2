<script setup lang="ts">
import { Send } from 'lucide-vue-next';
import { computed } from 'vue';
import type { RouteLocationRaw } from 'vue-router';
import { FINISHED_STATUSES, IN_PROGRESS_STATUSES } from '@/api/types/submissions';
import type { SubmissionDetail } from '@/api/types/submissions';
import AppButton from '@/components/ui/AppButton.vue';
import BitLoop from '@/components/BitLoop.vue';
import BitMascot from '@/components/BitMascot.vue';
import LanguageLabel from '@/components/language/LanguageLabel.vue';
import Card from '@/components/ui/Card.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import { translate } from '@/i18n';
import { NO_VALUE, formatNumber, scoreBelowFull } from '@/lib/format';
import { provisionalPoints, ringProgress } from '@/lib/grading';
import { PARTIAL_CODE, VERDICT_TONE_VARS, verdictOfCode, type Verdict } from '@/lib/verdicts';
import { BIT_MOODS } from '@/mascot/bit-moods';
import { verdictBitMood } from '@/mascot/verdict-bit';
import { useLocaleStore } from '@/stores/locale.store';
import ShareButton from '@/features/shares/ShareButton.vue';
import TestStrip from './list/TestStrip.vue';
import { heroParts } from './hero-line';
import VerdictRing from './VerdictRing.vue';

/** Two decimals like the problem header; no digit grouping, scores are read as plain numbers. */
const SCORE_FRACTION_DIGITS = 2;

/**
 * The score card: the 128 px ring, the verdict, the score and the Bit mascot, then the failing test, passed count, time,
 * memory and language, and what to do now: "Nộp lại" for the author, "Về đề bài" for everyone (the primary action when
 * there is nothing to resubmit). The default slot is the footer of the same card (staff actions). Keep
 * `SubmissionHeroSkeleton.vue` in step.
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
  /** A judged contest submission: the contest points lead, the problem's score moves to the line below. */
  contestScore?: { points: string; max: string } | null;
  /** The submission's id when the viewer may share it (`viewer.canShare`): adds "Chia sẻ" to the actions. */
  shareId?: string | null;
  /** Where "Bài tiếp theo" leads: set only for the author's own accepted submission outside a contest. */
  nextTo?: RouteLocationRaw | null;
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
  return props.submission.points === null
    ? NO_VALUE
    : format(scoreBelowFull(props.submission.points, props.problemPoints, SCORE_FRACTION_DIGITS));
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
/** Only a finished submission has a final verdict worth a crown or a sweat drop; until then the hourglass Bit judges. */
const bit = computed(() => {
  const mood = isFinished.value ? verdictBitMood(props.verdict) : null;
  return mood ? BIT_MOODS[mood] : null;
});
const contestOutOf = computed(() =>
  props.contestScore ? translate('submission.contest.outOf', { max: props.contestScore.max }) : '',
);
/**
 * The score card's headline and its muted "out of": the contest's points in a contest, else the problem's. The "out of"
 * is one unbreakable piece: it stays on the headline's line while there is room and wraps whole when there is not.
 */
const scoreText = computed(() =>
  props.contestScore
    ? { value: props.contestScore.points, outOf: contestOutOf.value }
    : { value: score.value, outOf: maxScore.value ? `/ ${maxScore.value}` : '' },
);
/** In a contest the problem's own score is the line's first part. */
const problemScore = computed(() =>
  props.contestScore && maxScore.value
    ? translate('submission.contest.problemScore', { score: score.value, max: maxScore.value })
    : null,
);
const parts = computed(() => [
  ...(problemScore.value ? [{ text: problemScore.value }] : []),
  ...heroParts(props.submission),
]);
/** The first failing test gets its own line under the score; the rest (tests passed, time, memory) stays in the small line. */
const failingTest = computed(() => {
  const failed = parts.value.find((part) => 'key' in part && part.key === 'failed');
  if (!failed || !('values' in failed) || !('status' in failed.values)) return null;
  const verdict = translate(verdictOfCode(failed.values.status).labelKey);
  return translate('submission.overview.failed', {
    number: failed.values.number,
    verdict: verdict.toLocaleLowerCase(locale.locale),
  });
});
const line = computed(() =>
  parts.value
    .map((part) => {
      if ('text' in part) return part.text;
      if (part.key === 'passed') return translate('submission.overview.allPassed', part.values);
      return null;
    })
    .filter((text) => text !== null)
    .join(' · '),
);
/** The verdict name takes its tone's colour; AC pops once and WA nudges once (see the style block). */
const nameColour = computed(() => `var(${VERDICT_TONE_VARS[props.verdict.tone]})`);
const motion = computed(() => {
  if (!isFinished.value) return null;
  if (props.verdict.code === 'AC') return 'verdict-pop';
  return props.verdict.code === 'WA' ? 'verdict-nudge' : null;
});
/** Failed: fix first. Accepted by the author: the next problem is the primary and resubmitting steps back. */
const resubmitIsPrimary = computed(() => props.canResubmit && !props.nextTo);
const resubmitLabel = computed(() =>
  props.verdict.code === 'AC' ? 'submission.actions.resubmit' : 'submission.actions.resubmitFix',
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
    class="@container min-w-0 overflow-hidden rounded-card"
  >
    <div class="flex flex-wrap items-center gap-x-6 gap-y-4 p-6 sm:p-8">
      <div :class="motion" class="shrink-0">
        <VerdictRing
          size="lg"
          :progress="isFinished ? null : ringProgress(submission)"
          :verdict="verdict"
          :share="partialShare"
          :is-empty="submission.status === 'PD'"
        />
      </div>
      <div class="order-1 min-w-0 flex-1 basis-full @xl:order-none @xl:basis-40">
        <p
          v-if="isLive"
          data-testid="grading-line"
          class="flex items-center gap-2 text-display leading-9 font-semibold"
          :style="{ color: nameColour }"
        >
          <span
            aria-hidden="true"
            class="size-2.5 rounded-full bg-positive motion-safe:animate-pulse"
          />
          {{ $t(verdict.labelKey) }}
        </p>
        <p
          v-else
          data-testid="verdict-name"
          :class="motion"
          class="text-display leading-9 font-semibold"
          :style="{ color: nameColour }"
        >
          {{ $t(verdict.labelKey) }}
        </p>
        <p
          data-testid="score"
          class="mt-1 font-mono text-score leading-none font-semibold tabular-nums"
        >
          <span class="text-score">
            <SkeletonBlock v-if="isProblemLoading" text class="w-40" />
            <template v-else>{{ scoreText.value }}</template>
          </span>
          <template v-if="!isProblemLoading && scoreText.outOf"
            >{{ ' '
            }}<span class="text-section whitespace-nowrap text-muted">{{
              scoreText.outOf
            }}</span></template
          >
        </p>
        <p v-if="isProvisional" data-testid="provisional" class="text-meta text-muted">
          {{ $t('submission.provisional') }}
        </p>
        <p v-if="failingTest" data-testid="failing-test" class="mt-2 text-title font-semibold">
          {{ failingTest }}
        </p>
        <p
          v-if="line || submission.language"
          data-testid="hero-line"
          class="mt-1 text-meta text-muted"
        >
          {{ line }}
          <!-- The "·" wraps with the language, never alone at a line end. -->
          <span v-if="submission.language" class="whitespace-nowrap"
            ><template v-if="line">· </template><LanguageLabel :language="submission.language"
          /></span>
        </p>
        <p v-if="submission.isPretested" class="mt-1 text-meta text-muted">
          {{ $t('submission.pretest') }}
        </p>
      </div>
      <BitLoop
        v-if="!isFinished"
        data-testid="judging-bit"
        kind="judging"
        class="ml-auto [--bit-px:4px] @2xl:[--bit-px:6px]"
      />
      <BitMascot
        v-else-if="bit"
        :look="bit.look"
        :label="$t(bit.labelKey)"
        :closed-eyes="bit.eyesShut"
        class="ml-auto [--bit-px:4px] @2xl:[--bit-px:6px]"
      />
      <div v-if="submission.testSummary" class="order-2 w-full @xl:order-none">
        <TestStrip :summary="submission.testSummary" :is-grading="!isFinished" />
      </div>
      <div v-if="problem || shareId" class="order-3 flex w-full flex-wrap gap-2 @xl:order-none">
        <AppButton v-if="nextTo" tone="primary" :to="nextTo">
          {{ $t('submission.actions.next') }}
        </AppButton>
        <AppButton
          v-if="canResubmit"
          :tone="resubmitIsPrimary ? 'primary' : 'secondary'"
          :to="{ name: 'problem', params: { code: problem }, query: { resubmit: submission.id } }"
        >
          <template #icon><Send aria-hidden="true" class="size-4" /></template>
          {{ $t(resubmitLabel) }}
        </AppButton>
        <AppButton
          v-if="problem"
          :tone="canResubmit || nextTo ? 'secondary' : 'primary'"
          :to="{ name: 'problem', params: { code: problem } }"
        >
          {{ $t('submission.actions.problem') }}
        </AppButton>
        <ShareButton v-if="shareId" :submission-id="shareId" />
      </div>
    </div>
    <slot />
  </Card>
</template>

<style scoped>
/* AC: one pop (1 to 1.12 and back); WA: one 3 px nudge. Transform only; reduced motion shows none. */
@keyframes verdict-pop {
  50% {
    transform: scale(1.12);
  }
}
@keyframes verdict-nudge {
  50% {
    transform: translateX(-3px);
  }
}
@media (prefers-reduced-motion: no-preference) {
  .verdict-pop {
    animation: verdict-pop 320ms var(--qh-ease-spring);
  }
  .verdict-nudge {
    animation: verdict-nudge var(--qh-duration) var(--qh-ease);
  }
}
</style>
