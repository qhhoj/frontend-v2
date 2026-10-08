import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { PLACEMENT_LOOKS, bitFrame, spriteCells } from '@/mascot/bit-sprite';
import InlineBit from './InlineBit.vue';

const colours = (wrapper: ReturnType<typeof mount>) =>
  new Set(wrapper.findAll('span').map((cell) => cell.element.style.backgroundColor));

describe('InlineBit', () => {
  it('is decorative and a fixed 48 px box for every kind', () => {
    for (const kind of ['sweat', 'crown', 'asleep'] as const) {
      const bit = mount(InlineBit, { props: { kind } });
      expect(bit.attributes('aria-hidden')).toBe('true');
      expect(bit.attributes('role')).toBeUndefined();
      expect(bit.classes()).toContain('[--bit-px:3px]');
    }
  });

  it('draws the look of its kind: crown gold, sweat highlight, nightcap in the charcoal body', () => {
    const cellCount = (kind: 'sweat' | 'crown' | 'asleep') =>
      mount(InlineBit, { props: { kind } }).findAll('span').length;
    const expected = (look: (typeof PLACEMENT_LOOKS)[keyof typeof PLACEMENT_LOOKS]) =>
      spriteCells(
        bitFrame({ headgear: look.headgear, keepPosition: true, blinking: true }),
        look.palette,
      ).length;
    expect(cellCount('crown')).toBe(expected(PLACEMENT_LOOKS.accepted));
    expect(cellCount('sweat')).toBe(expected(PLACEMENT_LOOKS.rejected));
    expect(cellCount('asleep')).toBe(expected(PLACEMENT_LOOKS.emptyList));
    expect(colours(mount(InlineBit, { props: { kind: 'asleep' } })).has('rgb(61, 58, 54)')).toBe(
      true,
    );
  });
});
