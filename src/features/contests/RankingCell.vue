<script setup lang="ts">
import { Star } from 'lucide-vue-next';
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import type { RouteLocationRaw } from 'vue-router';
import type { RankingCellView } from '@/lib/ranking-cells';
import ScoreTick from './ScoreTick.vue';
import { TABLE_CELL_CLASSES, TABLE_CELL_TIME_CLASSES } from './ranking-cell-classes';

/** The board row is 36 px (`--qh-row-dense`), the cell box 32 px inside it: the score and, under it, the time. */
const CELL_BOX_CLASS = 'h-8';

const props = defineProps<{ view: RankingCellView; to?: RouteLocationRaw; tick?: boolean }>();

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
      class="flex flex-col items-center justify-center overflow-hidden rounded-cell px-1 text-center leading-none whitespace-nowrap tabular-nums"
      :class="[
        CELL_BOX_CLASS,
        TABLE_CELL_CLASSES[view.kind],
        to && 'cursor-pointer transition-shadow hover:ring-2 hover:ring-line-strong',
      ]"
      :title="view.time"
    >
      <span aria-hidden="true" class="flex items-center gap-1 text-sm font-semibold">
        <Star v-if="view.kind === 'first-solve'" class="size-3 shrink-0" /><ScoreTick
          :text="view.text"
          :animate="tick"
        />
      </span>
      <span
        v-if="view.time"
        aria-hidden="true"
        data-testid="cell-time"
        class="mt-0.5 max-w-full truncate text-tiny font-normal"
        :class="TABLE_CELL_TIME_CLASSES[view.kind]"
        >{{ view.time }}</span
      >
      <span class="sr-only">{{ $t(view.labelKey, view.labelParams, labelCount) }}</span>
    </component>
  </td>
</template>
