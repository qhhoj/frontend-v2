<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import BitLoop from '@/components/BitLoop.vue';
import type { ContestProblem } from '@/api/types/contests';
import type { RankingContext } from '@/lib/ranking-cells';
import { KIND_CLASSES } from './ranking-cell-classes';
import { ownResultView } from './own-result';

const props = defineProps<{ problem: ContestProblem; context: RankingContext }>();
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
  <span v-if="view.kind === 'cell'" class="block">
    <span
      class="block rounded-cell px-1 py-1.5 font-semibold whitespace-nowrap"
      :class="KIND_CLASSES[view.cell.kind]"
    >
      <span aria-hidden="true"
        >{{ view.cell.text
        }}<small v-if="view.cell.time" class="block text-[11px] leading-tight font-medium">{{
          view.cell.time
        }}</small></span
      >
      <span class="sr-only">{{ cellLabel }}</span>
    </span>
    <span aria-hidden="true" class="mt-1 block max-w-[200px] text-[12px] text-muted">
      {{ cellLabel }}
    </span>
  </span>
  <span
    v-else-if="view.kind === 'pending'"
    class="inline-flex items-center gap-1.5 rounded-cell px-2 py-1 font-semibold whitespace-nowrap"
    :class="KIND_CLASSES.pending"
  >
    <BitLoop data-testid="judging-bit" kind="judging" class="[--bit-px:2px]" />
    {{ $t('contests.problems.pending') }}
  </span>
  <span v-else-if="view.kind === 'attempted'" class="text-[13px] whitespace-nowrap text-muted">
    {{ $t('contests.problems.attempted', { count: view.attempts }, view.attempts) }}
  </span>
  <span v-else-if="view.kind === 'untouched'" class="text-[13px] text-muted">
    {{ $t('ranking.cell.empty') }}
  </span>
  <span v-else class="text-muted">
    <span aria-hidden="true">—</span>
    <span class="sr-only">{{ $t('contests.problems.resultHidden') }}</span>
  </span>
</template>
