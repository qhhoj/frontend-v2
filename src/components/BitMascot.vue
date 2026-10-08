<script setup lang="ts">
import { computed } from 'vue';
import BitSprite from '@/components/BitSprite.vue';
import type { BitLook } from '@/mascot/bit-sprite';
import { usePeriodicBlink } from '@/mascot/use-periodic-blink';

/**
 * Bit as a page placement: a fixed square box (16 pixels wide and tall, so a blink never shifts the layout) around BitSprite.
 * The pixel size is the CSS variable `--bit-px`, set by the caller's classes (`[--bit-px:5px] sm:[--bit-px:8px]`).
 * With a `label` it is an image; without one it is decorative and hidden from assistive technology.
 */
const props = defineProps<{
  look: BitLook;
  label?: string;
  /** Eyes shut for good (asleep, sad). */
  closedEyes?: boolean;
  /** Eyes open, closing for a moment every few seconds. */
  blinks?: boolean;
}>();
const periodicBlink = usePeriodicBlink(() => Boolean(props.blinks));
const eyesShut = computed(() => props.closedEyes || (props.blinks && periodicBlink.value));
</script>

<template>
  <div
    :role="label ? 'img' : undefined"
    :aria-label="label"
    :aria-hidden="label ? undefined : 'true'"
    class="shrink-0"
    style="width: calc(var(--bit-px, 4px) * 16); height: calc(var(--bit-px, 4px) * 16)"
  >
    <BitSprite :look="look" :blinking="eyesShut" />
  </div>
</template>
