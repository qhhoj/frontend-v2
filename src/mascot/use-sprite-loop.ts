import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { Ref } from 'vue';
import { useReducedMotion } from '@/lib/use-reduced-motion';
import type { BitLoop } from './bit-frames';

/**
 * Steps a Bit through its loop frames and returns the frame index. One timer at a time, and only while the element is mounted,
 * on screen (IntersectionObserver where it exists) and not under `prefers-reduced-motion`; otherwise the index stays on frame 0
 * (reduced motion) or holds the frame it stopped on (off screen). Each frame lasts its own `frameMs`.
 */
export function useSpriteLoop(loop: () => BitLoop, target: Ref<Element | null>) {
  const frameIndex = ref(0);
  const reducedMotion = useReducedMotion();
  const onScreen = ref(true);
  const isRunning = computed(() => !reducedMotion.value && onScreen.value);
  let timerId: ReturnType<typeof setTimeout> | undefined;
  let observer: IntersectionObserver | undefined;

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
  watch(
    isRunning,
    (running) => {
      stop();
      if (running) scheduleNext();
      else if (reducedMotion.value) frameIndex.value = 0;
    },
    { immediate: true },
  );
  onMounted(() => {
    if (typeof IntersectionObserver !== 'function' || !target.value) return;
    observer = new IntersectionObserver((entries) => {
      onScreen.value = entries.at(-1)?.isIntersecting ?? onScreen.value;
    });
    observer.observe(target.value);
  });
  onBeforeUnmount(() => {
    stop();
    observer?.disconnect();
  });
  return frameIndex;
}
