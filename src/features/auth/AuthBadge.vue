<script setup lang="ts">
/** Decoration: the heading beside it says the same, so the badge is hidden from assistive technology. */
defineProps<{ tone: 'accent' | 'positive' | 'warning' | 'negative' }>();
const TONES = {
  accent: 'bg-accent-soft text-accent-text',
  positive: 'bg-verdict-ac-bg text-verdict-ac',
  warning: 'bg-verdict-tle-bg text-verdict-tle',
  negative: 'bg-verdict-wa-bg text-verdict-wa',
} as const;
</script>

<template>
  <span
    aria-hidden="true"
    class="flex size-14 items-center justify-center self-center rounded-full [&>svg]:size-7"
    :class="TONES[tone]"
  >
    <slot />
  </span>
</template>
