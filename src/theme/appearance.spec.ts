import { describe, expect, it } from 'vitest';
import {
  ACCENTS,
  appearanceVariables,
  GLASS_STOPS,
  nearestGlassStop,
  parseAppearance,
  siteLook,
} from './appearance';
import { THEMES } from './registry';

describe('accent presets', () => {
  it('are the ids the backend accepts (backend APPEARANCE_ACCENTS), in picker order', () => {
    expect(ACCENTS.map((accent) => accent.id)).toEqual([
      'clay',
      'orchid',
      'ocean',
      'mint',
      'sunset',
      'gold',
      'mono',
    ]);
  });
});

describe('siteLook', () => {
  it("is a theme's own look: its accent at Glass 0 (Clear) and Glow 100 (the site's blobs)", () => {
    expect(siteLook('orchid')).toEqual({ accent: 'orchid', glass: 0, glow: 100 });
  });
});

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
    ['a negative glass', { accent: 'mint', glass: -1, glow: 10 }],
    ['a numeric string', { accent: 'mint', glass: '50', glow: 10 }],
    ['a missing field', { accent: 'mint', glass: 10 }],
    ['null', null],
    ['a string', 'ocean'],
    ['an array', []],
  ])('reads %s as no look', (_name, value) => {
    expect(parseAppearance(value)).toBeNull();
  });

  it("accepts every theme's own look", () => {
    for (const theme of THEMES)
      expect(parseAppearance(siteLook(theme.accent))).toEqual(siteLook(theme.accent));
  });
});

describe('glass stops', () => {
  it.each([
    [0, 0],
    [24, 0],
    [25, 50],
    [50, 50],
    [74, 50],
    [75, 100],
    [100, 100],
  ])('highlights the nearest of Clear, Frosted and Solid for %i: %i', (glass, stop) => {
    expect(nearestGlassStop(glass)).toBe(stop);
  });

  it('offers Clear, Frosted, Solid as 0, 50, 100', () => {
    expect(GLASS_STOPS.map((stop) => stop.value)).toEqual([0, 50, 100]);
  });
});

describe('appearanceVariables', () => {
  it('turns glow into a 0-1 strength and keeps glass as the 0-100 number', () => {
    expect(appearanceVariables({ accent: 'sunset', glass: 40, glow: 35 })).toEqual({
      accent: 'sunset',
      glass: '40',
      blobStrength: '0.35',
    });
  });
});
