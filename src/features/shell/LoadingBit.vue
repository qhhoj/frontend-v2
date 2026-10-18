<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, watch } from 'vue';
import SwarmBit from '@/components/SwarmBit.vue';
import { useMotionOff } from '@/lib/use-motion-off';
import { BIT_LOOKS } from '@/mascot/bit-sprite';
import {
  LOADING_BIT_SIZE,
  bitCount,
  loadingLanes,
  spawnWalker,
  stepWalker,
} from '@/mascot/bit-walk';
import type { Bounds, Walker } from '@/mascot/bit-walk';
import { pageColumn, useBitPlacement, useFrameLoop, viewportSize } from '@/mascot/use-bit-swarm';
import { LOADING_TIMING } from './use-loading-phase';
import type { LoadingPhase } from './use-loading-phase';

/**
 * The loading swarm: decorative Bits (fixed, aria-hidden, pointer-events none) wandering in the gutters beside the content
 * column, or along the bottom of the viewport where the gutters are too narrow (`loadingLanes`), so they never cover the
 * header or the page. One animation loop steps every Bit and writes its transform straight to the DOM; only the leg frame
 * goes through Vue. The lanes are measured every frame, so a resize or a layout change moves them at once.
 * - walking: the Bits wander, each in its lane (a Bit outside it walks straight back in).
 * - fading: the content has painted; the Bits stop where they stand and the layer fades out.
 * Under reduced motion one Bit stands in the bottom-left corner and nothing moves. A hidden tab pauses the loop.
 */
const props = defineProps<{ phase: LoadingPhase }>();

const reducedMotion = useMotionOff();
const looks = computed(() =>
  props.phase === 'hidden'
    ? []
    : BIT_LOOKS.slice(0, reducedMotion.value ? 1 : bitCount(viewportSize().width)),
);
const { legSteps, bind, place, clear: clearPlacement } = useBitPlacement();
let walkers: Walker[] = [];

const isAnimated = () => props.phase === 'walking' && !reducedMotion.value;
const currentLanes = () => loadingLanes(viewportSize(), LOADING_BIT_SIZE, pageColumn());
/** Bit `index` walks in lane `index` modulo the lane count, so the gutters share the Bits. */
const laneOf = (lanes: Bounds[], index: number) => lanes[index % lanes.length]!;

function tick(frameMs: number) {
  const lanes = currentLanes();
  walkers = walkers.map((walker, index) =>
    stepWalker(walker, laneOf(lanes, index), frameMs, Math.random),
  );
  walkers.forEach((walker, index) => place(index, walker));
}
const loop = useFrameLoop(tick);

function startLoop() {
  if (!walkers.length) {
    const lanes = currentLanes();
    walkers = looks.value.map((_look, index) => spawnWalker(laneOf(lanes, index), Math.random));
    walkers.forEach((walker, index) => place(index, walker));
  }
  loop.start();
}

watch(
  [() => props.phase, reducedMotion],
  ([phase]) => {
    if (phase === 'hidden' || reducedMotion.value) walkers = [];
    if (reducedMotion.value) clearPlacement();
    if (isAnimated()) startLoop();
    else loop.stop();
  },
  { flush: 'post', immediate: true },
);

// A hidden tab pauses the loop; coming back restarts it from a fresh clock.
const onVisibilityChange = () => {
  if (document.hidden) loop.stop();
  else if (isAnimated()) startLoop();
};
onMounted(() => document.addEventListener('visibilitychange', onVisibilityChange));
onBeforeUnmount(() => {
  document.removeEventListener('visibilitychange', onVisibilityChange);
  loop.stop();
});
</script>

<template>
  <div
    v-if="phase !== 'hidden'"
    data-testid="loading-bits"
    :data-phase="phase"
    aria-hidden="true"
    class="pointer-events-none fixed inset-0 z-bit overflow-hidden transition-opacity"
    :class="phase === 'fading' ? 'opacity-0' : 'opacity-100'"
    :style="{ transitionDuration: `${LOADING_TIMING.fadeMs}ms` }"
  >
    <SwarmBit
      v-for="(look, index) in looks"
      :key="look.headgear"
      :ref="bind(index)"
      data-testid="loading-bit"
      :look="look"
      :step="legSteps[index]"
      class="pointer-events-none"
      :class="reducedMotion ? 'bottom-4 left-4' : 'top-0 left-0'"
    />
  </div>
</template>
