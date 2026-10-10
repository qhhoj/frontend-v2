<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import BitSprite from '@/components/BitSprite.vue';
import { useMotionOff } from '@/lib/use-motion-off';
import { BIT_LOOKS } from '@/mascot/bit-sprite';
import {
  LOADING_BIT_SIZE,
  LOADING_PIXEL,
  bitCount,
  hopOffset,
  isGone,
  leaveHeading,
  legStep,
  spawnWalker,
  stepLeaver,
  stepWalker,
  walkBounds,
} from '@/mascot/bit-walk';
import type { Walker } from '@/mascot/bit-walk';
import { LOADING_TIMING } from './use-loading-phase';
import type { LoadingPhase } from './use-loading-phase';

/**
 * The loading swarm: decorative Bits wandering over the viewport (fixed, aria-hidden, pointer-events none). One animation loop steps
 * every Bit and writes its transform straight to the DOM; only the leg frame goes through Vue.
 * - walking: the Bits wander (a Bit outside the walk bounds, e.g. one that was leaving, heads back in).
 * - leaving / fading: every Bit walks on at its own speed, straight to the nearest viewport edge (chosen once). It emits `gone`
 *   when the last Bit is out of sight; in `fading` the layer fades out while they keep walking.
 * Under reduced motion one Bit stands in the corner, nothing moves, and it emits `gone` at once when loading ends, so it disappears
 * without a transition. A hidden tab pauses the loop and likewise skips the exit.
 */
const props = defineProps<{ phase: LoadingPhase }>();
const emit = defineEmits<{ gone: [] }>();

const reducedMotion = useMotionOff();
// Measured without the scrollbar, which the fixed layer does not cover.
const viewport = () => ({
  width: document.documentElement.clientWidth,
  height: document.documentElement.clientHeight,
});
const looks = computed(() =>
  props.phase === 'hidden'
    ? []
    : BIT_LOOKS.slice(0, reducedMotion.value ? 1 : bitCount(viewport().width)),
);
const legSteps = ref<boolean[]>([]);
const bitElements: Array<HTMLElement | null> = [];
let walkers: Walker[] = [];
let frameId = 0;
let lastTimestamp: number | null = null;

const isExiting = () => props.phase === 'leaving' || props.phase === 'fading';
const isAnimated = () => props.phase !== 'hidden' && !reducedMotion.value;

function place(index: number) {
  const element = bitElements[index];
  const walker = walkers[index];
  if (!element || !walker) return;
  element.style.transform = `translate(${walker.x}px, ${walker.y + hopOffset(walker.hopMsLeft)}px)`;
  const flipper = element.firstElementChild as HTMLElement | null;
  if (flipper) flipper.style.transform = walker.facing < 0 ? 'scaleX(-1)' : 'none';
  const stepping = legStep(walker.travelled);
  if (legSteps.value[index] !== stepping) legSteps.value[index] = stepping;
}

/** Back to the CSS position (the corner under reduced motion). */
function clearPlacement() {
  bitElements.forEach((element) => {
    if (!element) return;
    element.style.transform = '';
    if (element.firstElementChild) (element.firstElementChild as HTMLElement).style.transform = '';
  });
}

function tick(timestamp: number) {
  const frameMs = lastTimestamp === null ? 0 : timestamp - lastTimestamp;
  lastTimestamp = timestamp;
  const area = viewport();
  if (isExiting()) walkers = walkers.map((walker) => stepLeaver(walker, frameMs));
  else {
    const bounds = walkBounds(area, LOADING_BIT_SIZE);
    walkers = walkers.map((walker) => stepWalker(walker, bounds, frameMs, Math.random));
  }
  walkers.forEach((_walker, index) => place(index));
  frameId = requestAnimationFrame(tick);
  if (isExiting() && walkers.every((walker) => isGone(walker, area, LOADING_BIT_SIZE)))
    emit('gone');
}

function startLoop() {
  if (!walkers.length) {
    const bounds = walkBounds(viewport(), LOADING_BIT_SIZE);
    walkers = looks.value.map(() => spawnWalker(bounds, Math.random));
    walkers.forEach((_walker, index) => place(index));
  }
  if (!frameId && !document.hidden) frameId = requestAnimationFrame(tick);
}

function stopLoop() {
  if (frameId) cancelAnimationFrame(frameId);
  frameId = 0;
  lastTimestamp = null;
}

/** The exit heading of every Bit, chosen once as leaving starts. */
function headForNearestEdge() {
  const area = viewport();
  walkers = walkers.map((walker) => ({
    ...walker,
    heading: leaveHeading(walker, area, LOADING_BIT_SIZE),
  }));
}

watch(
  [() => props.phase, reducedMotion],
  ([phase], previous) => {
    if (phase === 'hidden' || reducedMotion.value) walkers = [];
    if (reducedMotion.value) clearPlacement();
    if (!isAnimated()) return stopLoop();
    startLoop();
    if (phase === 'leaving' && previous?.[0] !== 'leaving') headForNearestEdge();
  },
  { flush: 'post', immediate: true },
);

// Nothing to walk off (one static Bit) or nobody watching (hidden tab): the exit is skipped.
watch(
  () => props.phase,
  (phase) => {
    if (phase === 'leaving' && (reducedMotion.value || document.hidden)) emit('gone');
  },
  { flush: 'post', immediate: true },
);

// A hidden tab pauses the loop; coming back restarts it from a fresh clock.
const onVisibilityChange = () => {
  if (document.hidden) {
    stopLoop();
    if (isExiting()) emit('gone');
  } else if (isAnimated()) startLoop();
};
onMounted(() => document.addEventListener('visibilitychange', onVisibilityChange));
onBeforeUnmount(() => {
  document.removeEventListener('visibilitychange', onVisibilityChange);
  stopLoop();
});
</script>

<template>
  <div
    v-if="phase !== 'hidden'"
    data-testid="loading-bits"
    :data-phase="phase"
    aria-hidden="true"
    class="pointer-events-none fixed inset-0 z-40 overflow-hidden transition-opacity"
    :class="phase === 'fading' ? 'opacity-0' : 'opacity-100'"
    :style="{ transitionDuration: `${LOADING_TIMING.fadeMs}ms` }"
  >
    <div
      v-for="(look, index) in looks"
      :key="look.headgear"
      :ref="(element) => (bitElements[index] = element as HTMLElement | null)"
      data-testid="loading-bit"
      :data-headgear="look.headgear"
      class="pointer-events-none absolute will-change-transform"
      :class="reducedMotion ? 'bottom-4 left-4' : 'top-0 left-0'"
      :style="{
        '--bit-px': `${LOADING_PIXEL}px`,
        width: `${LOADING_BIT_SIZE}px`,
        height: `${LOADING_BIT_SIZE}px`,
      }"
    >
      <div>
        <BitSprite :look="look" :step="legSteps[index]" />
      </div>
    </div>
  </div>
</template>
