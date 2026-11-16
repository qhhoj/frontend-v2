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
/** Profile sizes inset the sprite by 8 px so its hat and antenna stay inside the rounded tile; list sizes fill it. */
const inset = computed(() => (props.size >= 96 ? 8 : 0));
const rects = computed(() => avatarRects(avatarPixels(look.value), props.size - 2 * inset.value));
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
    <g :transform="`translate(${inset} ${inset})`">
      <rect
        v-for="(rect, index) in rects"
        :key="index"
        :x="rect.x"
        :y="rect.y"
        :width="rect.width"
        :height="rect.height"
        :fill="rect.colour"
      />
    </g>
  </svg>
</template>
