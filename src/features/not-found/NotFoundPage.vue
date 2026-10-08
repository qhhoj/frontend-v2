<script setup lang="ts">
import { useRoute } from 'vue-router';
import BitSprite from '@/components/BitSprite.vue';
import { BIT_PALETTES } from '@/mascot/bit-sprite';

const route = useRoute();
const CRYING_LOOK = { headgear: 'none', palette: 'terracotta' } as const;
const TEAR = BIT_PALETTES.terracotta;
/** Pixel font for the giant 404; X is a filled block. */
const DIGIT_ROWS = {
  '4': ['X..X', 'X..X', 'XXXX', '...X', '...X'],
  '0': ['XXXX', 'X..X', 'X..X', 'X..X', 'XXXX'],
} as const;
const DIGITS = ['4', '0', '4'] as const;
const digitCells = (digit: keyof typeof DIGIT_ROWS) =>
  DIGIT_ROWS[digit].flatMap((row) => [...row].map((cell) => cell === 'X'));
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
  <section
    class="mx-auto flex max-w-3xl flex-col items-center gap-4 px-4 py-10 text-center sm:py-16"
  >
    <div class="relative flex flex-col items-center">
      <!-- The pale 404 is decoration: token-coloured blocks, 16 px on a phone and 28 px from sm up. -->
      <div
        data-testid="pale-404"
        aria-hidden="true"
        class="-mb-[3.75rem] flex gap-3 [--block:16px] sm:gap-6 sm:[--block:28px]"
      >
        <div
          v-for="(digit, position) in DIGITS"
          :key="position"
          class="grid grid-cols-[repeat(4,var(--block))] auto-rows-[var(--block)]"
        >
          <span
            v-for="(filled, cell) in digitCells(digit)"
            :key="cell"
            class="rounded-[4px]"
            :class="filled ? 'bg-skeleton' : ''"
          />
        </div>
      </div>
      <div
        role="img"
        :aria-label="$t('notFound.bitLabel')"
        class="bit-sob relative [--bit-px:8px] sm:[--bit-px:12px]"
        style="width: calc(var(--bit-px) * 16); height: calc(var(--bit-px) * 16)"
      >
        <BitSprite :look="CRYING_LOOK" blinking tears />
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
    <h1 class="mt-2 font-display text-3xl font-bold tracking-tight sm:text-[40px]">
      {{ $t('notFound.title') }}
    </h1>
    <p class="max-w-md text-base leading-relaxed text-muted">{{ $t('notFound.body') }}</p>
    <div class="flex flex-wrap justify-center gap-2.5">
      <RouterLink
        to="/"
        class="bg-gradient-accent inline-flex min-h-11 items-center rounded-pill px-5 font-semibold text-on-accent"
      >
        {{ $t('notFound.home') }}
      </RouterLink>
      <RouterLink
        to="/problems"
        class="inline-flex min-h-11 items-center rounded-pill border border-line bg-surface-solid px-5 font-semibold text-content hover:bg-surface-hover"
      >
        {{ $t('notFound.problems') }}
      </RouterLink>
    </div>
    <p data-testid="requested-path" class="max-w-full font-mono text-[13px] break-all text-muted">
      {{ route.path }}
    </p>
  </section>
</template>
