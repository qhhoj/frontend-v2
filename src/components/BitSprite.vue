<script setup lang="ts">
import { computed } from 'vue';
import { SPRITE_SIZE, bitFrame, spriteCells } from '@/mascot/bit-sprite';
import type { BitLook } from '@/mascot/bit-sprite';

/** Draws Bit as a CSS grid of filled pixels. The size of one pixel is the CSS variable `--bit-px` (default 4px). */
const props = defineProps<{ look: BitLook; step?: boolean; blinking?: boolean; tears?: boolean }>();
const cells = computed(() =>
  spriteCells(
    bitFrame({
      headgear: props.look.headgear,
      step: props.step,
      blinking: props.blinking,
      tears: props.tears,
    }),
    props.look.palette,
  ),
);
</script>

<template>
  <div
    class="grid"
    :data-blinking="blinking ? 'true' : undefined"
    :style="{
      gridTemplateColumns: `repeat(${SPRITE_SIZE}, var(--bit-px, 4px))`,
      gridAutoRows: 'var(--bit-px, 4px)',
      imageRendering: 'pixelated',
    }"
  >
    <span
      v-for="cell in cells"
      :key="`${cell.row}-${cell.column}`"
      :style="{ gridColumn: cell.column, gridRow: cell.row, backgroundColor: cell.colour }"
    />
  </div>
</template>
