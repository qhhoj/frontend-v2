<script setup lang="ts">
import BitMascot from '@/components/BitMascot.vue';
import { PLACEMENT_LOOKS } from '@/mascot/bit-sprite';

/**
 * Bit beside a short notice, always decorative (the words next to it say it all): sweat for a problem, crown for a success,
 * nightcap for "nothing here yet". One size (48 px) so every notice row looks alike.
 */
const KIND_LOOKS = {
  sweat: PLACEMENT_LOOKS.rejected,
  crown: PLACEMENT_LOOKS.accepted,
  asleep: PLACEMENT_LOOKS.emptyList,
} as const;
defineProps<{ kind: keyof typeof KIND_LOOKS }>();
</script>

<template>
  <BitMascot data-testid="inline-bit" :look="KIND_LOOKS[kind]" closed-eyes class="[--bit-px:3px]" />
</template>
