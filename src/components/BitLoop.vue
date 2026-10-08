<script setup lang="ts">
import { computed, ref } from 'vue';
import { BIT_LOOPS } from '@/mascot/bit-frames';
import type { BitKind } from '@/mascot/bit-frames';
import { frameCells } from '@/mascot/bit-sprite';
import { useSpriteLoop } from '@/mascot/use-sprite-loop';

/**
 * A Bit that moves: one approved loop from bit-frames.ts, drawn as a CSS grid of filled pixels. The loop's blinks are part of its
 * frames, so no periodic blink runs here. The size of one pixel is the CSS variable `--bit-px` (default 4px). The box is the loop's
 * size, so every frame draws the same box. With a `label` it is an image; without one it is decorative and hidden from assistive technology.
 */
const props = defineProps<{ kind: BitKind; label?: string }>();
const root = ref<HTMLElement | null>(null);
const frameIndex = useSpriteLoop(() => BIT_LOOPS[props.kind], root);
const frames = computed(() => BIT_LOOPS[props.kind].frames);
const columns = computed(() => frames.value[0]?.[0]?.length ?? 0);
const rows = computed(() => frames.value[0]?.length ?? 0);
const cells = computed(() => frameCells(frames.value[frameIndex.value] ?? []));
</script>

<template>
  <div
    ref="root"
    :role="label ? 'img' : undefined"
    :aria-label="label"
    :aria-hidden="label ? undefined : 'true'"
    :data-frame="frameIndex"
    class="shrink-0"
    :style="{
      width: `calc(var(--bit-px, 4px) * ${columns})`,
      height: `calc(var(--bit-px, 4px) * ${rows})`,
    }"
  >
    <div
      class="grid"
      :style="{
        gridTemplateColumns: `repeat(${columns}, var(--bit-px, 4px))`,
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
  </div>
</template>
