import { describe, expect, it } from 'vitest';
import { LEGACY_ACCENTS, parseAppearance, toWireAppearance } from './appearance';

describe('parseAppearance', () => {
  it('reads a look, filling a missing contrast and background with the defaults and dropping unknown keys', () => {
    expect(parseAppearance({ accent: 'teal', hue: 300 })).toEqual({
      accent: 'teal',
      contrast: 'standard',
      background: 'blueprint',
    });
    expect(parseAppearance({ accent: 'plum', contrast: 'high', background: 'none' })).toEqual({
      accent: 'plum',
      contrast: 'high',
      background: 'none',
    });
    expect(parseAppearance({ accent: 'plum', contrast: 'max', background: 7 })).toEqual({
      accent: 'plum',
      contrast: 'standard',
      background: 'blueprint',
    });
  });

  it('reads a Clay or Glass look as its successor accent, ignoring the Glass levels', () => {
    for (const [old, successor] of Object.entries(LEGACY_ACCENTS))
      expect(parseAppearance({ accent: old, glass: 40, glow: 60 })).toEqual({
        accent: successor,
        contrast: 'standard',
        background: 'blueprint',
      });
  });

  it.each([
    ['an unknown accent', { accent: 'violet' }],
    ['an inherited-looking accent', { accent: 'constructor' }],
    ['no accent', { contrast: 'high' }],
    ['null', null],
    ['a string', 'teal'],
    ['an array', []],
  ])('reads %s as no look', (_name, value) => {
    expect(parseAppearance(value)).toBeNull();
  });
});

describe('toWireAppearance', () => {
  it('sends contrast and background only when they are not the defaults', () => {
    expect(
      toWireAppearance({ accent: 'teal', contrast: 'standard', background: 'blueprint' }),
    ).toEqual({ accent: 'teal' });
    expect(toWireAppearance({ accent: 'teal', contrast: 'high', background: 'stipple' })).toEqual({
      accent: 'teal',
      contrast: 'high',
      background: 'stipple',
    });
    expect(toWireAppearance(null)).toBeNull();
  });
});
