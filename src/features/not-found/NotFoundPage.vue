<script setup lang="ts">
import { useRoute } from 'vue-router';
import CryingBit from '@/components/CryingBit.vue';
import ShortLinkNotFoundHint from '@/components/ShortLinkNotFoundHint.vue';

const route = useRoute();
/** Pixel font for the giant 404; X is a filled block. */
const DIGIT_ROWS = {
  '4': ['X..X', 'X..X', 'XXXX', '...X', '...X'],
  '0': ['XXXX', 'X..X', 'X..X', 'X..X', 'XXXX'],
} as const;
const DIGITS = ['4', '0', '4'] as const;
const digitCells = (digit: keyof typeof DIGIT_ROWS) =>
  DIGIT_ROWS[digit].flatMap((row) => [...row].map((cell) => cell === 'X'));
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
      <CryingBit class="[--bit-px:8px] sm:[--bit-px:12px]" :label="$t('notFound.bitLabel')" />
    </div>
    <h1 class="mt-2 page-title">
      {{ $t('notFound.title') }}
    </h1>
    <p class="max-w-md text-base leading-relaxed text-muted">{{ $t('notFound.body') }}</p>
    <ShortLinkNotFoundHint />
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
    <p data-testid="requested-path" class="max-w-full font-mono text-meta break-all text-muted">
      {{ route.path }}
    </p>
  </section>
</template>
