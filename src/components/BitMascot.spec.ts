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

  it('is an image with a name when labelled, hidden from assistive technology when not', () => {
    const labelled = mountHero({ label: 'Bit in a cap' });
    expect(labelled.attributes('role')).toBe('img');
    expect(labelled.attributes('aria-label')).toBe('Bit in a cap');
    expect(labelled.attributes('aria-hidden')).toBeUndefined();
    const decorative = mountHero();
    expect(decorative.attributes('role')).toBeUndefined();
    expect(decorative.attributes('aria-hidden')).toBe('true');
  });

  it('keeps a fixed square box of 16 pixels, so a blink cannot move the layout', () => {
    expect(mountHero().attributes('style')).toContain('width: calc(var(--bit-px, 4px) * 16)');
    expect(mountHero().attributes('style')).toContain('height: calc(var(--bit-px, 4px) * 16)');
  });

  it('keeps the eyes shut when told to', () => {
    expect(eyePixels(mountHero({ closedEyes: true }))).toBe(0);
    expect(eyePixels(mountHero())).toBe(4);
  });

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

  it('does not blink unless asked to', async () => {
    stubMatchMedia({ reducedMotion: false });
    const bit = mountHero();
    await vi.advanceTimersByTimeAsync(BLINK_EVERY_MS);
    expect(eyePixels(bit)).toBe(4);
  });

  it('draws the charcoal twin for the empty-list look', () => {
    const asleep = mount(BitMascot, {
      props: { look: PLACEMENT_LOOKS.emptyList, closedEyes: true },
    });
    const bodyColours = asleep.findAll('span').map((cell) => cell.element.style.backgroundColor);
    expect(bodyColours).toContain('rgb(61, 58, 54)');
    expect(bodyColours).not.toContain('rgb(217, 119, 87)');
  });
});
