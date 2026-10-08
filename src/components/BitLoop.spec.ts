import { nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BIT_LOOPS } from '@/mascot/bit-frames';
import type { BitKind } from '@/mascot/bit-frames';
import { BIT_PALETTES, PODIUM_COLOUR } from '@/mascot/bit-sprite';
import { stubMatchMedia } from '@/test/match-media';
import BitLoop from './BitLoop.vue';

const toRgb = (hex: string) =>
  `rgb(${[1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16)).join(', ')})`;
const TERRACOTTA = BIT_PALETTES.terracotta;
const CHARCOAL = BIT_PALETTES.charcoal;

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
const mountLoop = (kind: BitKind, label?: string) =>
  mount(BitLoop, { props: { kind, label }, attachTo: document.body });

describe('BitLoop', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    stubMatchMedia({ reducedMotion: false });
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('draws the approved pixels of frame 0 and then of frame 1, in the palette the frame names', async () => {
    const hourglass = mountLoop('judging');
    expect(colourAt(hourglass, 0, 5)).toBe(toRgb(TERRACOTTA.A));
    await vi.advanceTimersByTimeAsync(BIT_LOOPS.judging.frameMs[0]!);
    expect(frameOf(hourglass)).toBe('1');
    expect(colourAt(hourglass, 0, 5)).toBe(toRgb(TERRACOTTA.H));

    const trio = mountLoop('community');
    expect(colourAt(trio, 8, 41)).toBe(toRgb(CHARCOAL.O));
    expect(colourAt(trio, 16, 18)).toBe(PODIUM_COLOUR);
    expect(trio.attributes('style')).toContain('calc(var(--bit-px, 4px) * 52)');
    expect(trio.attributes('style')).toContain('calc(var(--bit-px, 4px) * 22)');
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

  it('runs one timer while mounted and clears it on unmount', () => {
    const bit = mountLoop('welcome');
    expect(vi.getTimerCount()).toBe(1);
    bit.unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('shows frame 0 only under reduced motion, and runs no timer', async () => {
    stubMatchMedia({ reducedMotion: true });
    const bit = mountLoop('contest');
    expect(vi.getTimerCount()).toBe(0);
    await vi.advanceTimersByTimeAsync(BIT_LOOPS.contest.frameMs.reduce((sum, ms) => sum + ms, 0));
    expect(frameOf(bit)).toBe('0');
    expect(colourAt(bit, 2, 7)).toBe(toRgb(TERRACOTTA.A));
  });

  it('stops while off screen and resumes when back on screen', async () => {
    let report: ((entries: { isIntersecting: boolean }[]) => void) | undefined;
    const disconnect = vi.fn();
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(callback: typeof report) {
          report = callback;
        }
        observe() {}
        disconnect = disconnect;
      },
    );
    const bit = mountLoop('rankUp');
    expect(vi.getTimerCount()).toBe(1);
    report!([{ isIntersecting: false }]);
    await nextTick();
    expect(vi.getTimerCount()).toBe(0);
    await vi.advanceTimersByTimeAsync(10_000);
    expect(frameOf(bit)).toBe('0');
    report!([{ isIntersecting: true }]);
    await nextTick();
    expect(vi.getTimerCount()).toBe(1);
    bit.unmount();
    expect(disconnect).toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('is decorative without a label and an image with one', () => {
    const decorative = mountLoop('envelope');
    expect(decorative.attributes('aria-hidden')).toBe('true');
    expect(decorative.attributes('role')).toBeUndefined();
    const labelled = mountLoop('envelope', 'Bit với phong bì');
    expect(labelled.attributes('role')).toBe('img');
    expect(labelled.attributes('aria-label')).toBe('Bit với phong bì');
  });

  it('keeps every loop in its own box, the size of its first frame', () => {
    for (const kind of Object.keys(BIT_LOOPS) as BitKind[]) {
      const bit = mountLoop(kind);
      const [row] = BIT_LOOPS[kind].frames[0]!;
      expect(bit.attributes('style')).toContain(`calc(var(--bit-px, 4px) * ${row!.length})`);
      bit.unmount();
    }
  });
});
