<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { ContestProblem } from '@/api/types/contests';
import Lamp from '@/components/ui/Lamp.vue';
import type { CellKind, RankingContext } from '@/lib/ranking-cells';
import type { VerdictTone } from '@/lib/verdicts';
import { ownResultView } from './own-result';

/**
 * The viewer's own result on a contest problem, on one line: a lamp, the score (or the tries) in the result's colour and
 * the time in muted text; "Đang chấm" while a submission is judged, the number of tries when no result shows, "Chưa nộp"
 * otherwise. `inline` leaves the lamp out (the problem page's facts line).
 */
const props = defineProps<{ problem: ContestProblem; context: RankingContext; inline?: boolean }>();
const TEXT_TONES: Record<CellKind, string> = {
  empty: 'text-muted',
  'first-solve': 'text-verdict-ac',
  solved: 'text-verdict-ac',
  partial: 'text-verdict-partial',
  failed: 'text-verdict-wa',
  pending: 'text-verdict-pending',
};
const LAMP_TONES: Record<CellKind, VerdictTone | 'none'> = {
  empty: 'none',
  'first-solve': 'ac',
  solved: 'ac',
  partial: 'pc',
  failed: 'wa',
  pending: 'pending',
};
const { t } = useI18n();
const view = computed(() => ownResultView(props.problem, props.context));
/** The cell's words, read once by screen readers; the visible score and time are hidden from them. */
const cellLabel = computed(() => {
  if (view.value.kind !== 'cell') return '';
  const { labelKey, labelParams } = view.value.cell;
  return t(labelKey, labelParams, Number(labelParams.tries ?? 1));
});
</script>

<template>
  <span
    v-if="view.kind === 'cell'"
    class="inline-flex items-center gap-2 font-mono whitespace-nowrap tabular-nums"
  >
    <Lamp v-if="!inline" :tone="LAMP_TONES[view.cell.kind]" />
    <span aria-hidden="true" class="font-semibold" :class="TEXT_TONES[view.cell.kind]">{{
      view.cell.text
    }}</span>
    <span v-if="view.cell.time" aria-hidden="true" class="text-muted">· {{ view.cell.time }}</span>
    <span class="sr-only">{{ cellLabel }}</span>
  </span>
  <span
    v-else-if="view.kind === 'pending'"
    class="inline-flex items-center gap-2 font-semibold whitespace-nowrap text-verdict-pending"
  >
    <Lamp v-if="!inline" tone="pending" />
    {{ $t('contests.problems.pending') }}
  </span>
  <span
    v-else-if="view.kind === 'attempted'"
    class="inline-flex items-center gap-2 whitespace-nowrap text-muted"
  >
    <Lamp v-if="!inline" tone="none" />
    {{ $t('contests.problems.attempted', { count: view.attempts }, view.attempts) }}
  </span>
  <span v-else class="whitespace-nowrap text-muted">{{ $t('ranking.cell.empty') }}</span>
</template>
