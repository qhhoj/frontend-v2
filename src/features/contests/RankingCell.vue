<script setup lang="ts">
import { Star } from 'lucide-vue-next';
import { computed } from 'vue';
import type { CellKind, RankingCellView } from '@/lib/ranking-cells';

const props = defineProps<{ view: RankingCellView }>();

const KIND_CLASSES: Record<Exclude<CellKind, 'empty'>, string> = {
  'first-solve': 'bg-first-solve text-first-solve-text',
  solved: 'bg-verdict-ac-bg text-verdict-ac',
  partial: 'text-verdict-partial',
  failed: 'bg-verdict-wa-bg text-verdict-wa',
  pending: 'bg-verdict-pending-bg text-verdict-pending',
};
const PARTIAL_CLASSES = {
  1: 'bg-partial-bg-1',
  2: 'bg-partial-bg-2',
  3: 'bg-partial-bg-3',
} as const;
/** The spoken label pluralises on the number of tries (a label without tries is not plural). */
const labelCount = computed(() => Number(props.view.labelParams.tries ?? 1));
</script>

<template>
  <td class="p-1.5">
    <span v-if="view.kind === 'empty'" class="sr-only">{{ $t(view.labelKey) }}</span>
    <span
      v-else
      class="block rounded-cell px-1 py-1.5 font-semibold whitespace-nowrap"
      :class="[KIND_CLASSES[view.kind], view.partialStep && PARTIAL_CLASSES[view.partialStep]]"
    >
      <span aria-hidden="true"
        ><Star v-if="view.kind === 'first-solve'" class="mr-1 inline size-3 align-baseline" />{{
          view.text
        }}</span
      >
      <span class="sr-only">{{ $t(view.labelKey, view.labelParams, labelCount) }}</span>
    </span>
  </td>
</template>
