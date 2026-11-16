import { ref } from 'vue';
import { hopOffset, legStep } from './bit-walk';
import type { Column, Walker } from './bit-walk';

/**
 * The DOM side shared by every swarm of walking Bits (the loading swarm, the roaming Bits): one animation loop, and a placer
 * that writes each Bit's position straight to its element as a transform. Only the leg frame goes through Vue.
 */

/** The viewport a fixed layer covers: measured without the scrollbar. */
export const viewportSize = () => ({
  width: document.documentElement.clientWidth,
  height: document.documentElement.clientHeight,
});

/**
 * The content column of the page: the content box of the element marked `data-page-column` (the public header, whose edges
 * every page column shares), or null where there is none (admin and sign-in layouts).
 */
export function pageColumn(): Column | null {
  const element = document.querySelector<HTMLElement>('[data-page-column]');
  if (!element) return null;
  const box = element.getBoundingClientRect();
  const style = getComputedStyle(element);
  return {
    left: box.left + parseFloat(style.paddingLeft),
    right: box.right - parseFloat(style.paddingRight),
  };
}

/**
 * Elements of a swarm (`SwarmBit` roots, bound with `bind(index)`) and the writer of their transforms. `place` moves the box
 * (with its hop) and flips the sprite to face the walker's way; `clear` hands the boxes back to their CSS position.
 */
export function useBitPlacement() {
  const legSteps = ref<boolean[]>([]);
  const elements: Array<HTMLElement | null> = [];

  /** A template ref callback for Bit `index`: takes the element or the `SwarmBit` instance. */
  const bind = (index: number) => (target: unknown) => {
    const element = target && typeof target === 'object' && '$el' in target ? target.$el : target;
    elements[index] = element instanceof HTMLElement ? element : null;
  };

  function place(index: number, walker: Walker) {
    const element = elements[index];
    if (!element) return;
    element.style.transform = `translate(${walker.x}px, ${walker.y + hopOffset(walker.hopMsLeft)}px)`;
    const flipper = element.firstElementChild as HTMLElement | null;
    if (flipper) flipper.style.transform = walker.facing < 0 ? 'scaleX(-1)' : 'none';
    const stepping = legStep(walker.travelled);
    if (legSteps.value[index] !== stepping) legSteps.value[index] = stepping;
  }

  function clear() {
    elements.forEach((element) => {
      if (!element) return;
      element.style.transform = '';
      const flipper = element.firstElementChild as HTMLElement | null;
      if (flipper) flipper.style.transform = '';
    });
  }

  return { legSteps, elements, bind, place, clear };
}

/**
 * One requestAnimationFrame loop calling `tick` with the time since the previous frame (0 on the first one after a start).
 * `start` does nothing while running or while the tab is hidden; `stop` forgets the clock, so a restart never jumps.
 */
export function useFrameLoop(tick: (frameMs: number) => void) {
  let frameId = 0;
  let lastTimestamp: number | null = null;

  function frame(timestamp: number) {
    const frameMs = lastTimestamp === null ? 0 : timestamp - lastTimestamp;
    lastTimestamp = timestamp;
    frameId = requestAnimationFrame(frame);
    tick(frameMs);
  }

  function start() {
    if (!frameId && !document.hidden) frameId = requestAnimationFrame(frame);
  }

  function stop() {
    if (frameId) cancelAnimationFrame(frameId);
    frameId = 0;
    lastTimestamp = null;
  }

  return { start, stop };
}
