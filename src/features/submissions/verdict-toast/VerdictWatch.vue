<script setup lang="ts">
import { computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { FINISHED_STATUSES } from '@/api/types/submissions';
import { useToast } from '@/components/ui/use-toast';
import { useLiveSubmission } from '@/features/submissions/use-live-submission';
import { translate } from '@/i18n';
import { formatNumber, scoreBelowFull } from '@/lib/format';
import { submissionVerdictOf } from '@/lib/verdicts';
import { useLocaleStore } from '@/stores/locale.store';
import { celebratedProblems, submissionsOnScreen, untrackSubmission } from './tracked-submissions';
import type { TrackedSubmission } from './tracked-submissions';
import { planVerdictToast } from './verdict-toast-plan';

/**
 * Renders nothing. Follows one sent submission (the same live row the result strip reads) and, at its final verdict, shows one
 * toast unless the viewer is looking at the result: the submission's page, or an open result strip.
 */
const props = defineProps<{ entry: TrackedSubmission }>();
const SITE_DIGITS = 2;
const route = useRoute();
const locale = useLocaleStore();
const toast = useToast();
const { submission } = useLiveSubmission(computed(() => props.entry.id));

const row = computed(() => submission.data.value);
const isFinished = computed(
  () => row.value !== undefined && FINISHED_STATUSES.includes(row.value.status),
);
const isOnItsPage = () => route.name === 'submission' && route.params.id === props.entry.id;

const scoreText = (points: number, max: number) => {
  const format = (value: number) => formatNumber(value, locale.locale, SITE_DIGITS, false);
  return `${format(scoreBelowFull(points, max, SITE_DIGITS))} / ${format(max)}`;
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
  if (finished.points !== null && finished.problem)
    parts.push(scoreText(finished.points, finished.problem.points));
  toast.show({
    text: parts.join(' · '),
    tone: verdict.tone === 'ac' ? 'success' : 'info',
    verdict,
    celebrate: plan.celebrate,
    to: { name: 'submission', params: { id: props.entry.id } },
  });
}

watch(isFinished, (finished) => finished && announce(), { immediate: true });
</script>

<template><span hidden /></template>
