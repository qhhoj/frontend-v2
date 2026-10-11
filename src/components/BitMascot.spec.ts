import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PLACEMENT_LOOKS } from '@/mascot/bit-sprite';
import { BLINK_EVERY_MS, BLINK_LENGTH_MS } from '@/mascot/use-periodic-blink';
import { stubMatchMedia } from '@/test/match-media';
import BitMascot from './BitMascot.vue';

const eyePixels = (wrapper: ReturnType<typeof mount>) =>
  wrapper.findAll('span').filter((cell) => cell.element.style.backgroundColor === 'rgb(31, 30, 29)')
    .length;
const mountHero = (props: Record<string, unknown> = {}) =>
  mount(BitMascot, { props: { look: PLACEMENT_LOOKS.hero, ...props } });

describe('BitMascot', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('blinks every few seconds and opens its eyes again, drawing the same box', async () => {
    stubMatchMedia({ reducedMotion: false });
    const bit = mountHero({ blinks: true });
    expect(eyePixels(bit)).toBe(4);
    await vi.advanceTimersByTimeAsync(BLINK_EVERY_MS);
    expect(eyePixels(bit)).toBe(0);
    await vi.advanceTimersByTimeAsync(BLINK_LENGTH_MS);
    expect(eyePixels(bit)).toBe(4);
  });

  it('never blinks under reduced motion', async () => {
    stubMatchMedia({ reducedMotion: true });
    const bit = mountHero({ blinks: true });
    await vi.advanceTimersByTimeAsync(BLINK_EVERY_MS * 3);
    expect(eyePixels(bit)).toBe(4);
  });

  it('starts no timer unless it blinks, and clears it on unmount', () => {
    stubMatchMedia({ reducedMotion: false });
    mountHero().unmount();
    expect(vi.getTimerCount()).toBe(0);
    const bit = mountHero({ blinks: true });
    expect(vi.getTimerCount()).toBe(1);
    bit.unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
