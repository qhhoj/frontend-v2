<script setup lang="ts">
import BitSprite from '@/components/BitSprite.vue';
import { LOADING_BIT_SIZE, LOADING_PIXEL } from '@/mascot/bit-walk';
import type { BitLook } from '@/mascot/bit-sprite';

/**
 * One Bit of a swarm: a 64 px box (4 px per sprite pixel) that `useBitPlacement` moves by transform, and an inner flipper it
 * turns to face the walking direction. Position, pointer events and extra content (slot) come from the swarm.
 */
defineProps<{ look: BitLook; step?: boolean }>();
</script>

<template>
  <div
    :data-headgear="look.headgear"
    class="absolute will-change-transform"
    :style="{
      '--bit-px': `${LOADING_PIXEL}px`,
      width: `${LOADING_BIT_SIZE}px`,
      height: `${LOADING_BIT_SIZE}px`,
    }"
  >
    <div>
      <BitSprite :look="look" :step="step" />
    </div>
    <slot />
  </div>
</template>
