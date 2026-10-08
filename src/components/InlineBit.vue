<script setup lang="ts">
import BitMascot from '@/components/BitMascot.vue';
import { BIT_MOODS } from '@/mascot/bit-moods';
import type { BitMood } from '@/mascot/bit-moods';

/**
 * Bit beside a short notice, always decorative (the words next to it say it all): sweat for a problem, crown for a success,
 * asleep (nightcap) for "nothing here yet". One size (48 px) so every notice row looks alike. Moods and eyes come from BIT_MOODS.
 */
const props = defineProps<{ kind: BitMood }>();
</script>

<template>
  <BitMascot
    data-testid="inline-bit"
    :look="BIT_MOODS[props.kind].look"
    :closed-eyes="BIT_MOODS[props.kind].eyesShut"
    class="[--bit-px:3px]"
  />
</template>
