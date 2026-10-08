import { describe, expect, it } from 'vitest';
import { contrastRatio, mixPremultiplied, over, parseColour } from './contrast';

describe('contrast helpers', () => {
  it('rates black on white 21:1 and a colour on itself 1:1', () => {
    expect(contrastRatio(parseColour('#000000'), parseColour('#FFFFFF'))).toBeCloseTo(21, 5);
    expect(contrastRatio(parseColour('#7B61FF'), parseColour('#7B61FF'))).toBeCloseTo(1, 5);
  });

  it('composites a translucent colour over an opaque one', () => {
    expect(over(parseColour('rgba(255, 255, 255, 0.5)'), parseColour('#000000'))).toEqual([
      0.5, 0.5, 0.5, 1,
    ]);
  });

  it('refuses colour syntaxes the themes may not use', () => {
    expect(() => parseColour('#FFF')).toThrow('Unsupported colour');
    expect(() => parseColour('hsl(0 0% 0%)')).toThrow('Unsupported colour');
  });
});

describe('mixPremultiplied', () => {
  const white = parseColour('#FFFFFF');
  const black = parseColour('#000000');

  it('is the bottom colour at weight 0 and the top colour at weight 1', () => {
    expect(mixPremultiplied(white, black, 0)).toEqual(black);
    expect(mixPremultiplied(white, black, 1)).toEqual(white);
  });

  it('averages two opaque colours at weight 0.5', () => {
    expect(mixPremultiplied(white, black, 0.5)).toEqual([0.5, 0.5, 0.5, 1]);
  });

  it('interpolates alpha linearly and ignores the colour of a fully transparent side', () => {
    const glass = parseColour('rgba(255, 255, 255, 0.5)');
    const clear = [0, 0, 0, 0] as const;
    // 25 % of a half-transparent white over nothing: still white, alpha 0.25 (premultiplied, not darkened by the black).
    expect(mixPremultiplied(glass, clear, 0.5)).toEqual([1, 1, 1, 0.25]);
  });

  it('turns a translucent surface into the opaque colour at weight 1', () => {
    const solid = parseColour('#1b1530');
    const surface = parseColour('rgba(255, 255, 255, 0.04)');
    expect(mixPremultiplied(solid, surface, 1)).toEqual(solid);
  });

  it('returns transparent black, not NaN, when both sides are fully transparent', () => {
    const clear = [0, 0, 0, 0] as const;
    expect(mixPremultiplied(clear, clear, 0.5)).toEqual([0, 0, 0, 0]);
  });
});
