<script setup lang="ts">
import { computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useToast } from '@/components/ui/use-toast';
import { useLiveSubmission } from '@/features/submissions/use-live-submission';
import { translate } from '@/i18n';
import { formatNumber, scoreBelowFull } from '@/lib/format';
import { submissionVerdictOf } from '@/lib/verdicts';
import { useLocaleStore } from '@/stores/locale.store';
import { celebratedProblems, submissionsOnScreen, untrackSubmission } from './tracked-submissions';
import type { TrackedSubmission } from './tracked-submissions';
import { planVerdictToast, toastScore, trackingStep } from './verdict-toast-plan';
import type { ToastScore } from './verdict-toast-plan';

/**
 * Renders nothing. Follows one sent submission (the same live row the result strip reads) and, at its final verdict, shows one
 * toast unless the viewer is looking at the result: the submission's page, or an open result strip.
 */
const props = defineProps<{ entry: TrackedSubmission }>();
const SITE_DIGITS = 2;
const route = useRoute();
const locale = useLocaleStore();
const toast = useToast();
// Passive: the problem page's own follower of the same submission owns the stream while it lives.
const { submission } = useLiveSubmission(
  computed(() => props.entry.id),
  { isPassive: true },
);

const row = computed(() => submission.data.value);
const step = computed(() => (row.value ? trackingStep(row.value.status) : 'wait'));
const isOnItsPage = () => route.name === 'submission' && route.params.id === props.entry.id;

const scoreText = ({ score, max, contestPrecision }: ToastScore) => {
  const digits = contestPrecision ?? SITE_DIGITS;
  const format = (value: number) =>
    formatNumber(value, locale.locale, digits, contestPrecision !== null);
  return `${format(scoreBelowFull(score, max, digits))} / ${format(max)}`;
};

function announce() {
  const finished = row.value!;
  const verdict = submissionVerdictOf(finished);
  const code = finished.problem?.code ?? '';
  const plan = planVerdictToast({
    verdict,
    isResultOnScreen: isOnItsPage() || submissionsOnScreen.has(props.entry.id),
    wasSolvedBefore: props.entry.wasSolvedBefore,
    hasCelebratedProblem: celebratedProblems.has(code),
  });
  untrackSubmission(props.entry.id);
  if (!plan) return;
  if (plan.celebrate) celebratedProblems.add(code);
  const parts = [finished.problem?.name ?? translate(verdict.labelKey)];
  const score =
    finished.points !== null && finished.problem
      ? toastScore({
          points: finished.points,
          problemPoints: finished.problem.points,
          contest: finished.contest,
          scale: props.entry.scale,
        })
      : null;
  if (score) parts.push(scoreText(score));
  toast.show({
    text: parts.join(' · '),
    tone: verdict.tone === 'ac' ? 'success' : 'info',
    verdict,
    celebrate: plan.celebrate,
    to: { name: 'submission', params: { id: props.entry.id } },
  });
}

watch(
  step,
  (next) => {
    if (next === 'announce') announce();
    else if (next === 'drop') untrackSubmission(props.entry.id);
  },
  { immediate: true },
);
</script>

<template><span hidden /></template>
