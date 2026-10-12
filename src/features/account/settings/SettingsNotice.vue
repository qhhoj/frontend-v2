<script setup lang="ts">
import Notice from '@/components/ui/Notice.vue';
import type { BitKind } from '@/mascot/bit-frames';
import type { BitMood } from '@/mascot/bit-moods';

type SettingsTone = 'success' | 'error' | 'warning' | 'info';
const TONES = { success: 'success', error: 'danger', warning: 'warning', info: 'info' } as const;
/** `bit`: Bit in place of the icon, any `InlineBit` kind (crown = done, sweat = failed, security = locked or security notice). */
withDefaults(defineProps<{ tone: SettingsTone; bit?: BitMood | BitKind }>(), { bit: undefined });
</script>

<template>
  <Notice :tone="TONES[tone]" :bit="bit">
    <slot />
    <template #action><slot name="action" /></template>
  </Notice>
</template>
