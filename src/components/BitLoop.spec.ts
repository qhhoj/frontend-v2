import { nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import type { VueWrapper } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useLowPowerPainted } from '@/lib/use-low-power-painted';
import { BIT_LOOPS } from '@/mascot/bit-frames';
import type { BitKind } from '@/mascot/bit-frames';
import { BIT_PALETTES } from '@/mascot/bit-sprite';
import { stubMatchMedia } from '@/test/match-media';
import BitLoop from './BitLoop.vue';

const toRgb = (hex: string) =>
  `rgb(${[1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16)).join(', ')})`;
const TERRACOTTA = BIT_PALETTES.terracotta;

/** The colour drawn at (row, column), 0-based; undefined for a transparent pixel. */
const colourAt = (wrapper: ReturnType<typeof mount>, row: number, column: number) =>
  wrapper
    .findAll('span')
    .find(
      (cell) =>
        Number(cell.element.style.gridRow) === row + 1 &&
        Number(cell.element.style.gridColumn) === column + 1,
    )?.element.style.backgroundColor;
const frameOf = (wrapper: ReturnType<typeof mount>) => wrapper.attributes('data-frame');
/** Every wrapper a test mounts, unmounted after it so the shared observer and the timers are released. */
const mounted: VueWrapper[] = [];
const mountLoop = (kind: BitKind, label?: string) => {
  const wrapper = mount(BitLoop, { props: { kind, label }, attachTo: document.body });
  mounted.push(wrapper);
  return wrapper;
};
type ObserverReport = (entries: { target: Element; isIntersecting: boolean }[]) => void;
/** Replaces IntersectionObserver with one that counts its instances and lets a test report visibility. */
const stubObserver = () => {
  const observers: { report: ObserverReport; observed: Element[]; disconnect: () => void }[] = [];
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      observed: Element[] = [];
      disconnect = vi.fn();
      constructor(callback: ObserverReport) {
        observers.push({ report: callback, observed: this.observed, disconnect: this.disconnect });
      }
      observe(element: Element) {
        this.observed.push(element);
      }
      unobserve() {}
    },
  );
  return observers;
};

describe('BitLoop', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    stubMatchMedia({ reducedMotion: false });
  });
  afterEach(() => {
    for (const wrapper of mounted.splice(0)) {
      try {
        wrapper.unmount();
      } catch {
        // Already unmounted by the test.
      }
    }
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('advances through every frame at its own timing and wraps back to frame 0', async () => {
    const { frameMs, frames } = BIT_LOOPS.staff;
    const bit = mountLoop('staff');
    for (let index = 0; index < frames.length; index++) {
      expect(frameOf(bit)).toBe(String(index));
      await vi.advanceTimersByTimeAsync(frameMs[index]!);
    }
    expect(frameOf(bit)).toBe('0');
  });

  it('shows frame 0 only under reduced motion, and runs no timer', async () => {
    stubMatchMedia({ reducedMotion: true });
    const bit = mountLoop('contest');
    expect(vi.getTimerCount()).toBe(0);
    await vi.advanceTimersByTimeAsync(BIT_LOOPS.contest.frameMs.reduce((sum, ms) => sum + ms, 0));
    expect(frameOf(bit)).toBe('0');
    expect(colourAt(bit, 2, 7)).toBe(toRgb(TERRACOTTA.A));
  });

  it('shows frame 0 only in low-power mode, and runs no timer', async () => {
    document.documentElement.dataset.lowPower = '';
    await vi.waitFor(() => expect(useLowPowerPainted().value).toBe(true));
    const bit = mountLoop('contest');
    expect(vi.getTimerCount()).toBe(0);
    await vi.advanceTimersByTimeAsync(BIT_LOOPS.contest.frameMs.reduce((sum, ms) => sum + ms, 0));
    expect(frameOf(bit)).toBe('0');
  });

  it('stops while off screen and resumes when back on screen', async () => {
    const observers = stubObserver();
    const bit = mountLoop('rankUp');
    const observer = observers[0];
    expect(vi.getTimerCount()).toBe(1);
    observer!.report([{ target: bit.element, isIntersecting: false }]);
    await nextTick();
    expect(vi.getTimerCount()).toBe(0);
    await vi.advanceTimersByTimeAsync(10_000);
    expect(frameOf(bit)).toBe('0');
    observer!.report([{ target: bit.element, isIntersecting: true }]);
    await nextTick();
    expect(vi.getTimerCount()).toBe(1);
    bit.unmount();
    expect(observer!.disconnect).toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('shares one IntersectionObserver between every Bit on the page', () => {
    const observers = stubObserver();
    const first = mountLoop('judging');
    const second = mountLoop('contest');
    expect(observers).toHaveLength(1);
    expect(observers[0]!.observed).toEqual([first.element, second.element]);
    first.unmount();
    expect(observers[0]!.disconnect).not.toHaveBeenCalled();
    second.unmount();
    expect(observers[0]!.disconnect).toHaveBeenCalled();
  });

  it('pauses while the tab is hidden and resumes when it is shown again', async () => {
    let visibility: DocumentVisibilityState = 'visible';
    vi.spyOn(document, 'visibilityState', 'get').mockImplementation(() => visibility);
    const bit = mountLoop('welcome');
    expect(vi.getTimerCount()).toBe(1);
    visibility = 'hidden';
    document.dispatchEvent(new Event('visibilitychange'));
    await nextTick();
    expect(vi.getTimerCount()).toBe(0);
    await vi.advanceTimersByTimeAsync(10_000);
    expect(frameOf(bit)).toBe('0');
    visibility = 'visible';
    document.dispatchEvent(new Event('visibilitychange'));
    await nextTick();
    expect(vi.getTimerCount()).toBe(1);
    vi.restoreAllMocks();
  });
});
