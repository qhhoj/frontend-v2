<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import SwarmBit from '@/components/SwarmBit.vue';
import { useAdminToast } from '@/features/admin/ui/feedback/use-admin-toast';
import { translate } from '@/i18n';
import { useMotionOff } from '@/lib/use-motion-off';
import { cheer, isResting, spawnRoamers, stepLeavers, stepRoamers } from '@/mascot/bit-roam';
import type { Pointer, Roamer } from '@/mascot/bit-roam';
import { BIT_LOOKS } from '@/mascot/bit-sprite';
import { LOADING_BIT_SIZE, bitCount, isGone, leaveHeading, walkBounds } from '@/mascot/bit-walk';
import { useBitPlacement, useFrameLoop, viewportSize } from '@/mascot/use-bit-swarm';
import { useLoadingStore } from '@/stores/loading.store';
import { useBitRoamStore } from './bit-roam.store';
import PixelHearts from './PixelHearts.vue';
import { useInLiveContest } from './use-in-live-contest';

/**
 * The roaming Bits (Settings → Giao diện): the loading Bits wandering over the page for as long as it is open, under the rules
 * of `mascot/bit-roam.ts` (never closer than 1.2 body widths, never onto the mouse pointer). One animation loop, transforms
 * only. The layer is fixed, aria-hidden and takes no clicks; a resting Bit's own box does: a tap makes it hop with hearts, a
 * double click or a 0.5 s hold shoos every Bit for the browser session (a toast offers "Gọi lại").
 * Not on admin pages, inside a live contest, or while the loading swarm is out. Under reduced motion or low power one Bit
 * stands still in the bottom-left corner and takes no clicks. A hidden tab pauses the loop. A Bit never rests on a link,
 * button or field, so it never takes a click meant for one.
 */
const HOLD_MS = 500;
/** The shooed Bits that have not left by then are dropped (a pointer resting in their way can hold them up). */
const EXIT_MAX_MS = 4000;

const store = useBitRoamStore();
const route = useRoute();
const loading = useLoadingStore();
const motionOff = useMotionOff();
const toast = useAdminToast({ lazy: true });
const isInLiveContest = useInLiveContest(() => store.choice.on);
const viewportWidth = ref(viewportSize().width);

const isWanted = computed(
  () =>
    store.choice.on &&
    !store.resting &&
    route.meta.layout !== 'admin' &&
    !route.meta.adminArea &&
    !isInLiveContest.value &&
    !loading.isWaiting,
);
/** Phones (under 768 px) hold at most 3, like the loading swarm. */
const wantedCount = computed(() =>
  motionOff.value ? 1 : Math.min(store.choice.count, bitCount(viewportWidth.value)),
);

const { legSteps, elements, bind, place, clear: clearPlacement } = useBitPlacement();
/** How many Bits are drawn; the walkers themselves are plain data, read and written only by the loop. */
const shownCount = ref(0);
const looks = computed(() => BIT_LOOKS.slice(0, shownCount.value));
const cheers = ref<number[]>([]);
let roamers: Roamer[] = [];
let pointer: Pointer | null = null;
let leaving = false;
let exitTimer: ReturnType<typeof setTimeout> | undefined;

/** What a resting Bit's box must not cover: it would take the click meant for the control (the layer sits above the header). */
const CONTROLS =
  'a, button, input, select, textarea, label, summary, [role="button"], [role="link"], [tabindex]:not([tabindex="-1"])';
const INSET = LOADING_BIT_SIZE / 4;
/** True when a control lies under the box (read once, when a Bit is about to rest; walking Bits take no pointer events). */
function isOverControl(roamer: Roamer) {
  const far = LOADING_BIT_SIZE - INSET;
  return [
    [LOADING_BIT_SIZE / 2, LOADING_BIT_SIZE / 2],
    [INSET, INSET],
    [far, INSET],
    [INSET, far],
    [far, far],
  ].some(([dx, dy]) =>
    document.elementFromPoint(roamer.x + dx!, roamer.y + dy!)?.closest(CONTROLS),
  );
}

const areaNow = () => ({
  bounds: walkBounds(viewportSize(), LOADING_BIT_SIZE),
  pointer,
});

function placeAll() {
  roamers.forEach((roamer, index) => {
    place(index, roamer);
    const element = elements[index];
    // Only a resting Bit takes clicks; written only when it changes.
    const pointerEvents = !leaving && isResting(roamer) ? 'auto' : 'none';
    if (element && element.style.pointerEvents !== pointerEvents)
      element.style.pointerEvents = pointerEvents;
  });
}

function tick(frameMs: number) {
  const viewport = viewportSize();
  if (leaving) {
    roamers = stepLeavers(roamers, viewport, pointer, frameMs);
    if (roamers.every((roamer) => isGone(roamer, viewport, LOADING_BIT_SIZE)))
      return finishLeaving();
  } else {
    const before = roamers;
    roamers = stepRoamers(roamers, areaNow(), frameMs, Math.random).map((roamer, index) =>
      isResting(roamer) && !isResting(before[index]!) && isOverControl(roamer)
        ? { ...roamer, restMsLeft: 0 }
        : roamer,
    );
  }
  placeAll();
}
const loop = useFrameLoop(tick);

function removeAll() {
  loop.stop();
  roamers = [];
  cheers.value = [];
  shownCount.value = 0;
}

/** Bumped by every sync, so one that resumes after a newer one started does nothing. */
let syncGeneration = 0;
async function sync() {
  const generation = ++syncGeneration;
  if (leaving) return;
  if (!isWanted.value) return removeAll();
  if (motionOff.value) {
    removeAll();
    clearPlacement();
    elements.forEach((element) => element?.style.removeProperty('pointer-events'));
    shownCount.value = 1;
    return;
  }
  roamers = spawnRoamers(wantedCount.value, areaNow(), Math.random, roamers);
  shownCount.value = roamers.length;
  await nextTick();
  if (generation !== syncGeneration) return;
  placeAll();
  loop.start();
}
watch([isWanted, wantedCount, motionOff], () => void sync(), { immediate: true, flush: 'post' });

function shoo() {
  if (leaving) return;
  store.shoo();
  toast.show({
    text: translate('bitRoam.resting'),
    tone: 'info',
    undo: store.callBack,
    undoLabel: translate('bitRoam.callBack'),
  });
  if (!roamers.length) return removeAll();
  leaving = true;
  const viewport = viewportSize();
  roamers = roamers.map((roamer) => ({
    ...roamer,
    restMsLeft: 0,
    heading: leaveHeading(roamer, viewport, LOADING_BIT_SIZE),
  }));
  placeAll();
  exitTimer = setTimeout(finishLeaving, EXIT_MAX_MS);
}

function finishLeaving() {
  clearTimeout(exitTimer);
  leaving = false;
  removeAll();
  void sync();
}

function cheerBit(index: number) {
  const roamer = roamers[index];
  if (!roamer || leaving || !isResting(roamer)) return;
  roamers[index] = cheer(roamer);
  cheers.value[index] = (cheers.value[index] ?? 0) + 1;
}

let holdTimer: ReturnType<typeof setTimeout> | undefined;
const startHold = () => {
  clearTimeout(holdTimer);
  holdTimer = setTimeout(shoo, HOLD_MS);
};
const cancelHold = () => clearTimeout(holdTimer);

/** The mouse (or pen) position; touch has no pointer to avoid. */
const onPointerMove = (event: PointerEvent) => {
  pointer = event.pointerType === 'touch' ? null : { x: event.clientX, y: event.clientY };
};
const forgetPointer = () => (pointer = null);
const onResize = () => (viewportWidth.value = viewportSize().width);
const onVisibilityChange = () => {
  if (!document.hidden) return roamers.length && !motionOff.value ? loop.start() : undefined;
  loop.stop();
  if (leaving) finishLeaving();
};

onMounted(() => {
  window.addEventListener('pointermove', onPointerMove, { passive: true });
  document.documentElement.addEventListener('pointerleave', forgetPointer);
  window.addEventListener('blur', forgetPointer);
  window.addEventListener('resize', onResize, { passive: true });
  document.addEventListener('visibilitychange', onVisibilityChange);
});
onBeforeUnmount(() => {
  window.removeEventListener('pointermove', onPointerMove);
  document.documentElement.removeEventListener('pointerleave', forgetPointer);
  window.removeEventListener('blur', forgetPointer);
  window.removeEventListener('resize', onResize);
  document.removeEventListener('visibilitychange', onVisibilityChange);
  clearTimeout(exitTimer);
  clearTimeout(holdTimer);
  loop.stop();
});
</script>

<template>
  <div
    v-if="shownCount"
    data-testid="roaming-bits"
    aria-hidden="true"
    class="pointer-events-none fixed inset-0 z-bit overflow-hidden"
  >
    <SwarmBit
      v-for="(look, index) in looks"
      :key="look.headgear"
      :ref="bind(index)"
      data-testid="roaming-bit"
      :look="look"
      :step="legSteps[index]"
      class="pointer-events-none cursor-pointer select-none"
      :class="motionOff ? 'bottom-4 left-4' : 'top-0 left-0'"
      @click="cheerBit(index)"
      @dblclick="shoo"
      @pointerdown="startHold"
      @pointerup="cancelHold"
      @pointercancel="cancelHold"
      @pointerleave="cancelHold"
      @contextmenu.prevent
    >
      <PixelHearts v-if="cheers[index]" :key="cheers[index]" />
    </SwarmBit>
  </div>
</template>
