import { describe, expect, it } from 'vitest';
import { contrastRatio, over, parseColour } from './contrast';

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
