<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import CryingBit from '@/components/CryingBit.vue';
import ShortLinkNotFoundHint from '@/components/ShortLinkNotFoundHint.vue';
import AppButton from '@/components/ui/AppButton.vue';

const route = useRoute();
const router = useRouter();
/** The router records the previous in-app page; a visitor who opened the address directly has none to go back to. */
const canGoBack = computed(() => typeof window.history.state?.back === 'string');
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
  <section class="page-column items-center text-center sm:py-16">
    <div class="flex flex-col items-center gap-4">
      <!-- The 404 is decoration: line-coloured blocks above Bit, 16 px on a phone and 28 px from sm up. -->
      <div
        data-testid="pale-404"
        aria-hidden="true"
        class="flex gap-3 [--block:16px] sm:gap-6 sm:[--block:28px]"
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
            :class="filled ? 'bg-line-strong' : ''"
          />
        </div>
      </div>
      <CryingBit class="[--bit-px:8px] sm:[--bit-px:12px]" :label="$t('notFound.bitLabel')" />
    </div>
    <h1 class="page-title">
      {{ $t('notFound.title') }}
    </h1>
    <p class="max-w-md text-base leading-relaxed text-muted">{{ $t('notFound.body') }}</p>
    <ShortLinkNotFoundHint />
    <div class="flex flex-wrap justify-center gap-2">
      <AppButton v-if="canGoBack" data-testid="not-found-back" @click="router.back()">{{
        $t('notFound.back')
      }}</AppButton>
      <AppButton to="/problems">{{ $t('notFound.problems') }}</AppButton>
      <AppButton tone="primary" to="/">{{ $t('notFound.home') }}</AppButton>
    </div>
    <p data-testid="requested-path" class="max-w-full font-mono text-meta break-all text-muted">
      {{ route.path }}
    </p>
  </section>
</template>
