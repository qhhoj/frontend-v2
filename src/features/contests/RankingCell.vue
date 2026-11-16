<script setup lang="ts">
import { Star } from 'lucide-vue-next';
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import type { RouteLocationRaw } from 'vue-router';
import type { RankingCellView } from '@/lib/ranking-cells';
import ScoreTick from './ScoreTick.vue';
import { TABLE_CELL_CLASSES } from './ranking-cell-classes';

/** The board row is 48 px (`h-12`), the cell box 40 px inside it: the score and, under it, the time. */
const CELL_BOX_CLASS = 'h-10';

const props = defineProps<{ view: RankingCellView; to?: RouteLocationRaw; tick?: boolean }>();

/** The spoken label pluralises on the number of tries (a label without tries is not plural). */
const labelCount = computed(() => Number(props.view.labelParams.tries ?? 1));
</script>

<template>
  <td class="h-12 px-0.5 py-0">
    <!-- An empty cell keeps the filled cell's box height so a row without attempts is as tall as the rest. -->
    <span v-if="view.kind === 'empty'" class="block" :class="CELL_BOX_CLASS"
      ><span class="sr-only">{{ $t(view.labelKey) }}</span></span
    >
    <component
      :is="to ? RouterLink : 'span'"
      v-else
      :to="to"
      class="relative flex flex-col items-center justify-center overflow-hidden rounded-cell px-1 text-center leading-none whitespace-nowrap tabular-nums"
      :class="[
        CELL_BOX_CLASS,
        TABLE_CELL_CLASSES[view.kind],
        to && 'cursor-pointer transition-shadow hover:ring-2 hover:ring-line-strong',
      ]"
      :title="view.time"
    >
      <Star
        v-if="view.kind === 'first-solve'"
        aria-hidden="true"
        class="absolute top-0.5 right-0.5 size-2.5 text-verdict-ac"
      />
      <span aria-hidden="true" class="text-sm font-normal"
        ><ScoreTick :text="view.text" :animate="tick"
      /></span>
      <span
        v-if="view.time"
        aria-hidden="true"
        data-testid="cell-time"
        class="mt-0.5 max-w-full truncate text-tiny font-normal text-muted"
        >{{ view.time }}</span
      >
      <span class="sr-only">{{ $t(view.labelKey, view.labelParams, labelCount) }}</span>
    </component>
  </td>
</template>
