import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { Ref } from 'vue';
import { useReducedMotion } from '@/lib/use-reduced-motion';
import type { BitLoop } from './bit-frames';

type VisibilityListener = (visible: boolean) => void;

/** One IntersectionObserver for every Bit on the page; it exists only while some Bit is watched. */
const watched = new Map<Element, VisibilityListener>();
let sharedObserver: IntersectionObserver | undefined;

const watchVisibility = (element: Element, listener: VisibilityListener) => {
  watched.set(element, listener);
  if (typeof IntersectionObserver !== 'function') return;
  sharedObserver ??= new IntersectionObserver((entries) => {
    for (const entry of entries) watched.get(entry.target)?.(entry.isIntersecting);
  });
  sharedObserver.observe(element);
};
const unwatchVisibility = (element: Element) => {
  watched.delete(element);
  sharedObserver?.unobserve(element);
  if (watched.size) return;
  sharedObserver?.disconnect();
  sharedObserver = undefined;
};

/**
 * Steps a Bit through its loop frames and returns the frame index. One timer at a time, and only while the element is mounted,
 * on screen (one shared IntersectionObserver where it exists), in a visible tab and not under `prefers-reduced-motion`. Otherwise
 * the timer stops: under reduced motion the index is frame 0, off screen or in a hidden tab it holds the frame it stopped on.
 * Each frame lasts its own `frameMs`; a new loop (the Bit's kind changed) starts again at frame 0.
 */
export function useSpriteLoop(loop: () => BitLoop, target: Ref<Element | null>) {
  const frameIndex = ref(0);
  const reducedMotion = useReducedMotion();
  const onScreen = ref(true);
  const tabVisible = ref(typeof document === 'undefined' || document.visibilityState !== 'hidden');
  const isRunning = computed(() => !reducedMotion.value && onScreen.value && tabVisible.value);
  let timerId: ReturnType<typeof setTimeout> | undefined;

  const scheduleNext = () => {
    timerId = setTimeout(() => {
      frameIndex.value = (frameIndex.value + 1) % loop().frames.length;
      scheduleNext();
    }, loop().frameMs[frameIndex.value]);
  };
  const stop = () => {
    clearTimeout(timerId);
    timerId = undefined;
  };
  const onVisibilityChange = () => {
    tabVisible.value = document.visibilityState !== 'hidden';
  };

  watch(
    isRunning,
    (running) => {
      stop();
      if (running) scheduleNext();
      else if (reducedMotion.value) frameIndex.value = 0;
    },
    { immediate: true },
  );
  watch(loop, () => {
    frameIndex.value = 0;
    stop();
    if (isRunning.value) scheduleNext();
  });
  onMounted(() => {
    document.addEventListener('visibilitychange', onVisibilityChange);
    if (target.value) watchVisibility(target.value, (visible) => (onScreen.value = visible));
  });
  onBeforeUnmount(() => {
    stop();
    document.removeEventListener('visibilitychange', onVisibilityChange);
    if (target.value) unwatchVisibility(target.value);
  });
  return frameIndex;
}
