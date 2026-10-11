<script setup lang="ts">
import type { Component } from 'vue';

export type ChipTone = 'neutral' | 'accent' | 'positive' | 'caution' | 'negative' | 'info';

/**
 * A status chip: icon and text on a tone's token pair, 24 px tall (the admin chip density), pill-shaped, never wrapping.
 * The text carries the meaning; colour only repeats it. Fixed vocabularies are in pages/admin.md.
 */
withDefaults(defineProps<{ tone?: ChipTone; icon?: Component }>(), {
  tone: 'neutral',
  icon: undefined,
});

const TONES: Record<ChipTone, string> = {
  neutral: 'border-line bg-surface-strong text-muted',
  accent: 'border-transparent bg-accent-soft text-accent-soft-text',
  positive: 'border-transparent bg-verdict-ac-bg text-verdict-ac',
  caution: 'border-transparent bg-verdict-tle-bg text-verdict-tle',
  negative: 'border-transparent bg-verdict-wa-bg text-verdict-wa',
  info: 'border-transparent bg-tag-5-bg text-tag-5',
};
</script>

<template>
  <span
    class="inline-flex h-[var(--qa-chip,1.5rem)] max-w-full shrink-0 items-center gap-1 rounded-pill border px-2 text-xs font-semibold whitespace-nowrap"
    :class="TONES[tone]"
  >
    <component
      :is="icon"
      v-if="icon"
      aria-hidden="true"
      class="size-3.5 shrink-0"
      :stroke-width="1.75"
    />
    <span class="truncate"><slot /></span>
  </span>
</template>
