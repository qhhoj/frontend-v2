<script setup lang="ts">
import type { Component } from 'vue';
import Chip from '@/components/ui/Chip.vue';
import type { ChipTone as UiChipTone } from '@/components/ui/Chip.vue';

export type ChipTone = 'neutral' | 'accent' | 'positive' | 'caution' | 'negative' | 'info';

/**
 * The admin status chip: a small `Chip` at the admin chip density (24 px, 32 px on coarse pointers, `--qa-chip`).
 * Fixed vocabularies are in pages/admin.md.
 */
withDefaults(defineProps<{ tone?: ChipTone; icon?: Component }>(), {
  tone: 'neutral',
  icon: undefined,
});

const TONES: Record<ChipTone, UiChipTone> = {
  neutral: 'neutral',
  accent: 'accent',
  positive: 'success',
  caution: 'warning',
  negative: 'danger',
  info: 'info',
};
</script>

<template>
  <Chip :tone="TONES[tone]" :icon="icon" size="sm" style="height: var(--qa-chip, 1.5rem)">
    <slot />
  </Chip>
</template>
