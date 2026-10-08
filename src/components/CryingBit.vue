<script setup lang="ts">
import BitSprite from '@/components/BitSprite.vue';
import { BIT_PALETTES, PLACEMENT_LOOKS } from '@/mascot/bit-sprite';

/**
 * Bit crying for the 404 page: a bare head with two tears running from the eyes and a puddle beneath. The caller sets the pixel size
 * by class (`[--bit-px:8px]`), which lands on the root. With a `label` the sprite is an image; without one it is decorative.
 */
defineProps<{ label?: string }>();
const TEAR = BIT_PALETTES.terracotta;
/** Where the two tears start, in sprite pixels: just under each eye (columns 5 and 9, row 11) and staggered. */
const TEARS = [
  { column: 5, delay: '0s' },
  { column: 9, delay: '0.55s' },
] as const;
const tearColours = {
  backgroundColor: TEAR.H,
  boxShadow: `0 0 0 calc(var(--bit-px) / 2) ${TEAR.O}`,
};
const puddleStyle = { backgroundColor: TEAR.H, boxShadow: `0 0 0 3px ${TEAR.O}59` };
</script>

<template>
  <div class="relative flex flex-col items-center">
    <div
      :role="label ? 'img' : undefined"
      :aria-label="label"
      :aria-hidden="label ? undefined : 'true'"
      class="bit-sob relative"
      style="width: calc(var(--bit-px) * 16); height: calc(var(--bit-px) * 16)"
    >
      <BitSprite :look="PLACEMENT_LOOKS.crying" blinking tears />
      <span
        v-for="tear in TEARS"
        :key="tear.column"
        class="bit-tear absolute motion-reduce:hidden"
        :style="{
          left: `calc(var(--bit-px) * ${tear.column})`,
          top: 'calc(var(--bit-px) * 11)',
          width: 'var(--bit-px)',
          height: 'calc(var(--bit-px) * 2)',
          ...tearColours,
          animationDelay: tear.delay,
        }"
      />
    </div>
    <!-- A soft puddle under Bit, in Bit's tear colour. -->
    <div
      aria-hidden="true"
      class="-mt-5 h-[18px] w-60 max-w-full rounded-[50%] opacity-55"
      :style="puddleStyle"
    />
  </div>
</template>
