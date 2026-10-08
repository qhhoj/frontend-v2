<script setup lang="ts">
import BitLoop from '@/components/BitLoop.vue';
import BitMascot from '@/components/BitMascot.vue';
import { BIT_LOOPS } from '@/mascot/bit-frames';
import type { BitKind } from '@/mascot/bit-frames';
import { BIT_MOODS } from '@/mascot/bit-moods';
import type { BitMood } from '@/mascot/bit-moods';

/**
 * Bit beside a short notice, always decorative (the words next to it say it all). The still moods come from BIT_MOODS: sweat for a
 * problem, crown for a success, asleep (nightcap) for "nothing here yet". The moving kinds are approved loops (BitLoop, mascot.md:
 * Motion). One size (48 px) so every notice row looks alike.
 */
const props = defineProps<{ kind: BitMood | BitKind }>();
const isLoop = (kind: string): kind is BitKind => kind in BIT_LOOPS;
</script>

<template>
  <BitLoop
    v-if="isLoop(props.kind)"
    data-testid="inline-bit"
    :kind="props.kind"
    class="[--bit-px:3px]"
  />
  <BitMascot
    v-else
    data-testid="inline-bit"
    :look="BIT_MOODS[props.kind].look"
    :closed-eyes="BIT_MOODS[props.kind].eyesShut"
    class="[--bit-px:3px]"
  />
</template>
