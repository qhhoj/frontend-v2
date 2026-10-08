import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { BIT_PALETTES } from '@/mascot/bit-sprite';
import type { BitLook } from '@/mascot/bit-sprite';
import BitSprite from './BitSprite.vue';

const look: BitLook = { headgear: 'none', palette: 'terracotta' };
const toRgb = (hex: string) =>
  `rgb(${[1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16)).join(', ')})`;
const cells = (props: Record<string, unknown>) =>
  mount(BitSprite, { props: { look, ...props } })
    .findAll('span')
    .map((cell) => ({
      row: Number(cell.element.style.gridRow),
      column: Number(cell.element.style.gridColumn),
      colour: cell.element.style.backgroundColor,
    }));
const legColumns = (props: Record<string, unknown>, row: number) =>
  cells(props)
    .filter((cell) => cell.row === row && cell.colour === toRgb(BIT_PALETTES.terracotta.O))
    .map((cell) => cell.column)
    .sort((first, second) => first - second);

describe('BitSprite', () => {
  const eyeColour = toRgb(BIT_PALETTES.terracotta.E);

  it('draws open eyes, and closes them when blinking', () => {
    expect(cells({}).filter((cell) => cell.colour === eyeColour)).toHaveLength(4);
    const blinking = mount(BitSprite, { props: { look, blinking: true } });
    expect(blinking.attributes('data-blinking')).toBe('true');
    expect(cells({ blinking: true }).filter((cell) => cell.colour === eyeColour)).toHaveLength(0);
  });

  it('moves the legs on a step and bobs the sprite one pixel without re-keying the body', () => {
    expect(legColumns({}, 13)).toEqual([4, 6, 10, 12]);
    expect(legColumns({ step: true }, 13)).toEqual([5, 7, 9, 11]);
    const stand = mount(BitSprite, { props: { look } });
    const step = mount(BitSprite, { props: { look, step: true } });
    expect(stand.attributes('style')).not.toContain('translateY');
    expect(step.attributes('style')).toContain('translateY(var(--bit-px, 4px))');
    const bodyCells = (cellsOf: typeof stand) =>
      cellsOf
        .findAll('span')
        .filter((cell) => Number(cell.element.style.gridRow) <= 10)
        .map((cell) => `${cell.element.style.gridRow}-${cell.element.style.gridColumn}`);
    expect(bodyCells(step)).toEqual(bodyCells(stand));
  });
});
