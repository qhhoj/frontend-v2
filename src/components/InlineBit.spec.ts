import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { BIT_PALETTES, PLACEMENT_LOOKS } from '@/mascot/bit-sprite';
import type { BitLook } from '@/mascot/bit-sprite';
import InlineBit from './InlineBit.vue';

const toRgb = (hex: string) =>
  `rgb(${[1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16)).join(', ')})`;
const cellsOf = (kind: 'sweat' | 'crown' | 'asleep') =>
  mount(InlineBit, { props: { kind } })
    .findAll('span')
    .map((cell) => ({
      row: Number(cell.element.style.gridRow),
      colour: cell.element.style.backgroundColor,
    }));
const coloursOf = (kind: 'sweat' | 'crown' | 'asleep') => cellsOf(kind).map((cell) => cell.colour);
/** Eye pixels are the sprite's eye colour for the kind's palette; closed eyes draw none. */
const eyePixels = (kind: 'sweat' | 'crown' | 'asleep', look: BitLook) =>
  coloursOf(kind).filter((colour) => colour === toRgb(BIT_PALETTES[look.palette].E)).length;

describe('InlineBit', () => {
  it('is decorative for every kind', () => {
    for (const kind of ['sweat', 'crown', 'asleep'] as const) {
      const bit = mount(InlineBit, { props: { kind } });
      expect(bit.attributes('aria-hidden')).toBe('true');
      expect(bit.attributes('role')).toBeUndefined();
    }
  });

  it('shows the crown with its eyes open, and the sweat and asleep Bits with their eyes shut', () => {
    expect(eyePixels('crown', PLACEMENT_LOOKS.accepted)).toBe(4);
    expect(eyePixels('sweat', PLACEMENT_LOOKS.rejected)).toBe(0);
    expect(eyePixels('asleep', PLACEMENT_LOOKS.emptyList)).toBe(0);
  });

  it('draws the look of its kind: a gold crown, a sweat drop above the head, a nightcap in the charcoal body', () => {
    const headRows = 6;
    const gold = toRgb(BIT_PALETTES.terracotta.A);
    expect(coloursOf('crown')).toContain(gold);
    expect(coloursOf('asleep')).not.toContain(gold);
    const dropAboveHead = cellsOf('sweat').filter(
      (cell) => cell.row <= headRows && cell.colour === toRgb(BIT_PALETTES.terracotta.H),
    );
    expect(dropAboveHead.length).toBeGreaterThan(0);
    expect(coloursOf('asleep')).toContain(toRgb(BIT_PALETTES.charcoal.B));
  });
});
