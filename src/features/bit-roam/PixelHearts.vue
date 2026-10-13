<script setup lang="ts">
import { BIT_PALETTES } from '@/mascot/bit-sprite';

/** Three pixel hearts that rise from Bit's head and fade (0.9 s). Remount it (new `key`) to play it again. */
const HEART = ['.#.#.', '#####', '.###.', '..#..'];
const CELLS = HEART.flatMap((row, rowIndex) =>
  [...row].flatMap((pixel, column) =>
    pixel === '#' ? [{ row: rowIndex + 1, column: column + 1 }] : [],
  ),
);
const HEARTS = [
  { left: 8, delayMs: 0 },
  { left: 27, delayMs: 120 },
  { left: 46, delayMs: 240 },
];
</script>

<template>
  <div class="pointer-events-none absolute inset-x-0 top-0" aria-hidden="true">
    <div
      v-for="heart in HEARTS"
      :key="heart.left"
      class="bit-heart absolute top-0 grid"
      :style="{
        left: `${heart.left}px`,
        animationDelay: `${heart.delayMs}ms`,
        gridTemplateColumns: 'repeat(5, 2px)',
        gridAutoRows: '2px',
      }"
    >
      <span
        v-for="cell in CELLS"
        :key="`${cell.row}-${cell.column}`"
        :style="{
          gridRow: cell.row,
          gridColumn: cell.column,
          backgroundColor: BIT_PALETTES.terracotta.B,
        }"
      />
    </div>
  </div>
</template>

<style scoped>
.bit-heart {
  opacity: 0;
  animation: bit-heart-rise 900ms ease-out forwards;
}
@keyframes bit-heart-rise {
  0% {
    opacity: 0;
    transform: translateY(0);
  }
  20% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translateY(-28px);
  }
}
</style>
