<script setup lang="ts">
import { computed } from 'vue';
import { avatarLook, avatarPixels, avatarRects } from './bit-avatar';
import type { AvatarSize, AvatarStatus } from './bit-avatar';

/**
 * A user's Bit avatar, generated from the username. Decorative: the name is always written next to it,
 * so the picture is hidden from assistive technology. Fixed size, so it never shifts the layout.
 */
const props = withDefaults(
  defineProps<{ username: string; size: AvatarSize; status?: AvatarStatus }>(),
  { status: 'active' },
);

const look = computed(() => avatarLook(props.username, props.status));
const rects = computed(() => avatarRects(avatarPixels(look.value), props.size));
/** The tile is 22 % of the size as a corner radius, rounded to whole pixels. */
const radius = computed(() => `${Math.round(props.size * 0.22)}px`);
</script>

<template>
  <svg
    aria-hidden="true"
    focusable="false"
    class="block shrink-0"
    :width="size"
    :height="size"
    :viewBox="`0 0 ${size} ${size}`"
    shape-rendering="crispEdges"
    :style="{
      background: look.tile.colour,
      borderRadius: radius,
      imageRendering: 'pixelated',
    }"
  >
    <rect
      v-for="(rect, index) in rects"
      :key="index"
      :x="rect.x"
      :y="rect.y"
      :width="rect.width"
      :height="rect.height"
      :fill="rect.colour"
    />
  </svg>
</template>
