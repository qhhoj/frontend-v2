<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router';
import BitSprite from '@/components/BitSprite.vue';
import type { BitLook } from '@/mascot/bit-sprite';

/** The QHHOJ wordmark: Space Grotesk bold with Bit in place of the "O" (the `o` slot swaps it). Bit stands on the baseline and is as tall as the capitals; his sprite colours are fixed in every theme. One link, the one place the brand text is drawn. */
withDefaults(defineProps<{ to?: RouteLocationRaw; size?: 'sm' | 'md' | 'lg' }>(), {
  to: '/',
  size: 'md',
});
const SIZES = { sm: 'text-subtitle', md: 'text-section', lg: 'text-display lg:text-page' } as const;
const LOOK: BitLook = { headgear: 'none', palette: 'terracotta' };
/** The visible part of the 16x16 sprite: 13 columns from column 1, 9 rows from row 5 (outline, body, legs). */
const COLUMNS = 13;
const ROWS = 9;
const FIRST_COLUMN = 1;
const FIRST_ROW = 5;
/** Capital height of Space Grotesk is about 0.7 em; one sprite pixel is that over the visible rows. */
const PIXEL = `${0.7 / ROWS}em`;
</script>

<template>
  <RouterLink
    :to="to"
    :aria-label="$t('app.name')"
    class="inline-flex min-h-11 shrink-0 items-center font-display leading-none font-bold tracking-tight whitespace-nowrap text-content"
    :class="SIZES[size]"
  >
    <span aria-hidden="true">
      QHH<slot name="o"
        ><span
          class="mx-[0.04em] inline-block overflow-hidden"
          :style="{
            '--bit-px': PIXEL,
            width: `calc(${COLUMNS} * ${PIXEL})`,
            height: `calc(${ROWS} * ${PIXEL})`,
          }"
        >
          <BitSprite
            :look="LOOK"
            :style="{
              margin: `calc(-${FIRST_ROW} * ${PIXEL}) 0 0 calc(-${FIRST_COLUMN} * ${PIXEL})`,
            }"
          /> </span></slot
      >J
    </span>
  </RouterLink>
</template>
