<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import BitLoop from '@/components/BitLoop.vue';
import type { ContestProblem } from '@/api/types/contests';
import type { CellKind, RankingContext } from '@/lib/ranking-cells';
import { KIND_CLASSES } from './ranking-cell-classes';
import { ownResultView } from './own-result';

/** `inline` draws the result as coloured text on one line (the problem page's facts card), not as a chip. */
const props = defineProps<{ problem: ContestProblem; context: RankingContext; inline?: boolean }>();
const INLINE_TONES: Record<CellKind, string> = {
  empty: 'text-muted',
  'first-solve': 'text-verdict-ac',
  solved: 'text-verdict-ac',
  partial: 'text-verdict-partial',
  failed: 'text-verdict-wa',
  pending: 'text-verdict-pending',
};
const { t } = useI18n();
const view = computed(() => ownResultView(props.problem, props.context));
/**
 * The cell's words, read once by screen readers. The visible caption under the chip repeats them, so it is
 * hidden from assistive technology.
 */
const cellLabel = computed(() => {
  if (view.value.kind !== 'cell') return '';
  const { labelKey, labelParams } = view.value.cell;
  return t(labelKey, labelParams, Number(labelParams.tries ?? 1));
});
</script>

<template>
  <span
    v-if="view.kind === 'cell' && inline"
    class="font-mono whitespace-nowrap tabular-nums"
    :class="INLINE_TONES[view.cell.kind]"
  >
    <span aria-hidden="true"
      >{{ view.cell.text }}<template v-if="view.cell.time"> · {{ view.cell.time }}</template></span
    >
    <span class="sr-only">{{ cellLabel }}</span>
  </span>
  <span v-else-if="view.kind === 'cell'" class="block">
    <span
      class="block rounded-cell px-1 py-1.5 font-semibold whitespace-nowrap"
      :class="KIND_CLASSES[view.cell.kind]"
    >
      <span aria-hidden="true"
        >{{ view.cell.text
        }}<small v-if="view.cell.time" class="block text-tiny leading-tight font-medium">{{
          view.cell.time
        }}</small></span
      >
      <span class="sr-only">{{ cellLabel }}</span>
    </span>
    <span
      aria-hidden="true"
      class="mt-1 block text-caption leading-snug text-muted xl:whitespace-nowrap"
    >
      {{ cellLabel }}
    </span>
  </span>
  <span
    v-else-if="view.kind === 'pending'"
    class="inline-flex items-center gap-1.5 rounded-cell font-semibold whitespace-nowrap"
    :class="inline ? 'text-verdict-pending' : ['px-2 py-1', KIND_CLASSES.pending]"
  >
    <BitLoop data-testid="judging-bit" kind="judging" class="[--bit-px:2px]" />
    {{ $t('contests.problems.pending') }}
  </span>
  <span v-else-if="view.kind === 'attempted'" class="text-meta whitespace-nowrap text-muted">
    {{ $t('contests.problems.attempted', { count: view.attempts }, view.attempts) }}
  </span>
  <span v-else class="text-meta whitespace-nowrap text-muted">{{ $t('ranking.cell.empty') }}</span>
</template>
