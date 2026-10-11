import { describe, expect, it } from 'vitest';
import { parseAppearance } from './appearance';

describe('parseAppearance', () => {
  it('accepts a complete look, boundaries included, and drops unknown keys', () => {
    expect(parseAppearance({ accent: 'mono', glass: 0, glow: 100 })).toEqual({
      accent: 'mono',
      glass: 0,
      glow: 100,
    });
    expect(parseAppearance({ accent: 'gold', glass: 100, glow: 0, hue: 300 })).toEqual({
      accent: 'gold',
      glass: 100,
      glow: 0,
    });
  });

  it.each([
    ['an unknown accent', { accent: 'violet', glass: 10, glow: 10 }],
    ['a fractional glass', { accent: 'mint', glass: 50.5, glow: 10 }],
    ['a glow above 100', { accent: 'mint', glass: 10, glow: 101 }],
    ['a glass above 100', { accent: 'mint', glass: 101, glow: 10 }],
    ['a negative glow', { accent: 'mint', glass: 10, glow: -1 }],
    ['a NaN glass', { accent: 'mint', glass: NaN, glow: 10 }],
    ['an infinite glow', { accent: 'mint', glass: 10, glow: Infinity }],
    ['a negative glass', { accent: 'mint', glass: -1, glow: 10 }],
    ['a numeric string', { accent: 'mint', glass: '50', glow: 10 }],
    ['a missing field', { accent: 'mint', glass: 10 }],
    ['null', null],
    ['a string', 'ocean'],
    ['an array', []],
  ])('reads %s as no look', (_name, value) => {
    expect(parseAppearance(value)).toBeNull();
  });
});
