<script setup lang="ts">
import BitMascot from '@/components/BitMascot.vue';
import { PLACEMENT_LOOKS } from '@/mascot/bit-sprite';

/**
 * Bit beside a short notice, always decorative (the words next to it say it all): sweat for a problem, crown for a success,
 * nightcap for "nothing here yet". One size (48 px) so every notice row looks alike. Crown keeps its eyes open (mascot.md:
 * Accepted); the other two shut them.
 */
const KIND_LOOKS = {
  sweat: { look: PLACEMENT_LOOKS.rejected, eyesShut: true },
  crown: { look: PLACEMENT_LOOKS.accepted, eyesShut: false },
  asleep: { look: PLACEMENT_LOOKS.emptyList, eyesShut: true },
} as const;
const props = defineProps<{ kind: keyof typeof KIND_LOOKS }>();
</script>

<template>
  <BitMascot
    data-testid="inline-bit"
    :look="KIND_LOOKS[props.kind].look"
    :closed-eyes="KIND_LOOKS[props.kind].eyesShut"
    class="[--bit-px:3px]"
  />
</template>
