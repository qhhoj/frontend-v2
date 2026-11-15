<script setup lang="ts">
import { Star } from 'lucide-vue-next';
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import type { RouteLocationRaw } from 'vue-router';
import type { RankingCellView } from '@/lib/ranking-cells';
import { KIND_CLASSES, PARTIAL_CLASSES } from './ranking-cell-classes';

/** One line per cell: the board row is 36 px (`--qh-row-dense`), the cell box 32 px inside it. */
const CELL_BOX_CLASS = 'h-8';

const props = defineProps<{ view: RankingCellView; to?: RouteLocationRaw }>();

/** The spoken label pluralises on the number of tries (a label without tries is not plural). */
const labelCount = computed(() => Number(props.view.labelParams.tries ?? 1));
</script>

<template>
  <td class="h-(--qh-row-dense) px-0.5 py-0">
    <!-- An empty cell keeps the filled cell's box height so a row without attempts is as tall as the rest. -->
    <span v-if="view.kind === 'empty'" class="block" :class="CELL_BOX_CLASS"
      ><span class="sr-only">{{ $t(view.labelKey) }}</span></span
    >
    <component
      :is="to ? RouterLink : 'span'"
      v-else
      :to="to"
      class="flex items-center justify-center gap-1 overflow-hidden rounded-cell px-1 text-center whitespace-nowrap tabular-nums"
      :class="[
        CELL_BOX_CLASS,
        KIND_CLASSES[view.kind],
        view.partialStep && PARTIAL_CLASSES[view.partialStep],
        to && 'cursor-pointer transition-shadow hover:ring-2 hover:ring-line-strong',
      ]"
      :title="view.time"
    >
      <Star v-if="view.kind === 'first-solve'" aria-hidden="true" class="size-3 shrink-0" />
      <span aria-hidden="true" class="shrink-0 font-semibold">{{ view.text }}</span>
      <span
        v-if="view.time"
        aria-hidden="true"
        data-testid="cell-time"
        class="min-w-0 truncate text-tiny font-medium"
        >{{ view.time }}</span
      >
      <span class="sr-only">{{ $t(view.labelKey, view.labelParams, labelCount) }}</span>
    </component>
  </td>
</template>
