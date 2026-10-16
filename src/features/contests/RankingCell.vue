<script setup lang="ts">
import { Star } from 'lucide-vue-next';
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import type { RouteLocationRaw } from 'vue-router';
import type { RankingCellView } from '@/lib/ranking-cells';
import { KIND_CLASSES, PARTIAL_CLASSES } from './ranking-cell-classes';

const props = defineProps<{ view: RankingCellView; to?: RouteLocationRaw }>();

/** The spoken label pluralises on the number of tries (a label without tries is not plural). */
const labelCount = computed(() => Number(props.view.labelParams.tries ?? 1));
</script>

<template>
  <td class="p-1.5">
    <span v-if="view.kind === 'empty'" class="sr-only">{{ $t(view.labelKey) }}</span>
    <component
      :is="to ? RouterLink : 'span'"
      v-else
      :to="to"
      class="flex h-12 flex-col items-center justify-center rounded-cell px-1 text-center font-semibold whitespace-nowrap"
      :class="[
        KIND_CLASSES[view.kind],
        view.partialStep && PARTIAL_CLASSES[view.partialStep],
        to && 'cursor-pointer transition hover:ring-2 hover:ring-line-strong',
      ]"
    >
      <span aria-hidden="true" class="block"
        ><Star v-if="view.kind === 'first-solve'" class="mr-1 inline size-3 align-baseline" />{{
          view.text
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
