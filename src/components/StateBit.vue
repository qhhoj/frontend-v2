<script setup lang="ts">
import BitLoop from '@/components/BitLoop.vue';
import BitMascot from '@/components/BitMascot.vue';
import CryingBit from '@/components/CryingBit.vue';
import { BIT_LOOPS } from '@/mascot/bit-frames';
import type { BitKind } from '@/mascot/bit-frames';
import { BIT_MOODS } from '@/mascot/bit-moods';
import type { BitMood } from '@/mascot/bit-moods';
import type { BitVariant } from '@/mascot/state-bits';

/**
 * REPLACEABLE HOOK: draws one Bit variant for a page state. Moods come from BIT_MOODS (BitMascot), moving kinds from BIT_LOOPS
 * (BitLoop, which also draws `community`), the 404 Bit is CryingBit. The pixel size is set here by class, never by InlineBit, which pins its own. `label` makes the
 * Bit an image; without one it is decoration beside words that say it all.
 */
const props = withDefaults(
  defineProps<{ variant: BitVariant; label?: string; size?: 'tiny' | 'inline' | 'panel' }>(),
  { label: undefined, size: 'panel' },
);
/** tiny: 24 px beside a number; inline: 48 px beside a line; panel: 64-80 px above a heading. */
const SIZE_CLASSES = {
  tiny: '[--bit-px:1.5px]',
  inline: '[--bit-px:3px]',
  panel: '[--bit-px:4px] sm:[--bit-px:5px]',
} as const;
const isMood = (variant: BitVariant): variant is BitMood => variant in BIT_MOODS;
const isLoop = (variant: BitVariant): variant is BitKind => variant in BIT_LOOPS;
</script>

<template>
  <span :data-bit-variant="variant" class="inline-flex">
    <CryingBit v-if="variant === 'crying'" :label="props.label" :class="SIZE_CLASSES[props.size]" />
    <BitMascot
      v-else-if="isMood(variant)"
      :look="BIT_MOODS[variant].look"
      :closed-eyes="BIT_MOODS[variant].eyesShut"
      :label="props.label"
      :class="SIZE_CLASSES[props.size]"
    />
    <BitLoop
      v-else-if="isLoop(variant)"
      :kind="variant"
      :label="props.label"
      :class="SIZE_CLASSES[props.size]"
    />
  </span>
</template>
