<script setup lang="ts">
import { CircleAlert, CircleCheck, Info, TriangleAlert } from 'lucide-vue-next';
import InlineBit from '@/components/InlineBit.vue';
import type { BitKind } from '@/mascot/bit-frames';
import type { BitMood } from '@/mascot/bit-moods';

type NoticeTone = 'success' | 'error' | 'warning' | 'info';
/** Same tints as the verdicts and the auth notices: no notice colour of its own. */
const TONES: Record<NoticeTone, string> = {
  success: 'bg-verdict-ac-bg text-verdict-ac',
  error: 'bg-verdict-wa-bg text-verdict-wa',
  warning: 'bg-verdict-tle-bg text-verdict-tle',
  info: 'bg-accent-soft text-accent-soft-text',
};
const ICONS = {
  success: CircleCheck,
  error: CircleAlert,
  warning: TriangleAlert,
  info: Info,
} as const;
/** A failure interrupts, a finished action is announced politely, standing advice is just text. */
const ROLES: Record<NoticeTone, 'alert' | 'status' | undefined> = {
  success: 'status',
  error: 'alert',
  warning: undefined,
  info: undefined,
};
/** `bit`: Bit in place of the icon, any `InlineBit` kind (crown = done, sweat = failed, security = locked or security notice). */
withDefaults(defineProps<{ tone: NoticeTone; bit?: BitMood | BitKind }>(), { bit: undefined });
</script>

<template>
  <div
    :role="ROLES[tone]"
    class="flex items-start gap-2.5 rounded-row px-3.5 py-3 text-sm leading-normal"
    :class="TONES[tone]"
  >
    <InlineBit v-if="bit" :kind="bit" />
    <component :is="ICONS[tone]" v-else aria-hidden="true" class="mt-0.5 size-[18px] shrink-0" />
    <p class="m-0 flex-1"><slot /></p>
    <slot name="action" />
  </div>
</template>
