<script setup lang="ts">
import { Star } from 'lucide-vue-next';
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import type { RouteLocationRaw } from 'vue-router';
import type { RankingCellView } from '@/lib/ranking-cells';
import { KIND_CLASSES, PARTIAL_CLASSES } from './ranking-cell-classes';

/** The one cell height, filled or empty. */
const CELL_BOX_CLASS = 'h-12';

const props = defineProps<{ view: RankingCellView; to?: RouteLocationRaw }>();

/** The spoken label pluralises on the number of tries (a label without tries is not plural). */
const labelCount = computed(() => Number(props.view.labelParams.tries ?? 1));
</script>

<template>
  <td class="p-1.5">
    <!-- An empty cell keeps the filled cell's box height so a row without attempts is as tall as the rest. -->
    <span v-if="view.kind === 'empty'" class="block" :class="CELL_BOX_CLASS"
      ><span class="sr-only">{{ $t(view.labelKey) }}</span></span
    >
    <component
      :is="to ? RouterLink : 'span'"
      v-else
      :to="to"
      class="relative flex flex-col items-center justify-center rounded-cell px-1 text-center font-semibold whitespace-nowrap tabular-nums"
      :class="[
        CELL_BOX_CLASS,
        KIND_CLASSES[view.kind],
        view.partialStep && PARTIAL_CLASSES[view.partialStep],
        to && 'cursor-pointer transition-shadow hover:ring-2 hover:ring-line-strong',
      ]"
    >
      <!-- The star is out of the flow so the text stays centred identically in every row. -->
      <Star
        v-if="view.kind === 'first-solve'"
        aria-hidden="true"
        class="absolute top-1 left-1 size-3"
      />
      <span aria-hidden="true" class="block"
        >{{ view.text
        }}<small
          v-if="view.time"
          data-testid="cell-time"
          class="block text-tiny leading-tight font-medium"
          >{{ view.time }}</small
        ></span
      >
      <span class="sr-only">{{ $t(view.labelKey, view.labelParams, labelCount) }}</span>
    </component>
  </td>
</template>
