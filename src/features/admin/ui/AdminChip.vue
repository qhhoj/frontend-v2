<script setup lang="ts">
import type { Component } from 'vue';
import Chip from '@/components/ui/Chip.vue';
import type { ChipTone as UiChipTone } from '@/components/ui/Chip.vue';

/** `positive`/`caution`/`negative` are the old names of `success`/`warning`/`danger` (the vocabulary of Chip and Notice). */
export type ChipTone =
  | 'neutral'
  | 'accent'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'positive'
  | 'caution'
  | 'negative';

/**
 * The admin status chip: a small `Chip` (22 px, like everywhere). Deprecated: new code uses `Chip` directly; migrate with the
 * tone map below. Fixed vocabularies are in pages/admin.md.
 */
withDefaults(defineProps<{ tone?: ChipTone; icon?: Component }>(), {
  tone: 'neutral',
  icon: undefined,
});

const TONES: Record<ChipTone, UiChipTone> = {
  neutral: 'neutral',
  accent: 'accent',
  success: 'success',
  warning: 'warning',
  danger: 'danger',
  info: 'info',
  positive: 'success',
  caution: 'warning',
  negative: 'danger',
};
</script>

<template>
  <Chip :tone="TONES[tone]" :icon="icon" size="sm">
    <slot />
  </Chip>
</template>
