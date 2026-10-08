<script setup lang="ts">
import { computed } from 'vue';
import BitLoop from '@/components/BitLoop.vue';
import type { ContestProblem } from '@/api/types/contests';
import type { RankingContext } from '@/lib/ranking-cells';
import { KIND_CLASSES } from './ranking-cell-classes';
import { ownResultView } from './own-result';

const props = defineProps<{ problem: ContestProblem; context: RankingContext }>();
const view = computed(() => ownResultView(props.problem, props.context));
/** The spoken label pluralises on the number of tries, as the ranking cell does. */
const cellLabelCount = computed(() =>
  view.value.kind === 'cell' ? Number(view.value.cell.labelParams.tries ?? 1) : 1,
);
</script>

<template>
  <span
    v-if="view.kind === 'cell'"
    class="block rounded-cell px-1 py-1.5 font-semibold whitespace-nowrap"
    :class="KIND_CLASSES[view.cell.kind]"
  >
    <span aria-hidden="true"
      >{{ view.cell.text
      }}<small v-if="view.cell.time" class="block text-[11px] leading-tight font-medium">{{
        view.cell.time
      }}</small></span
    >
    <span class="sr-only">{{ $t(view.cell.labelKey, view.cell.labelParams, cellLabelCount) }}</span>
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
  <span v-else class="text-muted">
    <span aria-hidden="true">—</span>
    <span class="sr-only">{{ $t('ranking.cell.empty') }}</span>
  </span>
</template>
