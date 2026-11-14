import { describe, expect, it } from 'vitest';
import css from './backgrounds.css?raw';
import { BACKGROUNDS } from './appearance';

describe('backgrounds.css', () => {
  it.each(BACKGROUNDS.filter((choice) => choice.id !== 'none'))(
    'draws $id on the page and on its picker thumbnail',
    ({ id }) => {
      expect(css).toContain(`:is(html, .background-sample)[data-background='${id}']`);
    },
  );

  it('gives low-power mode and reduced motion no pattern layers, only a flat tint', () => {
    expect(css).toContain("html[data-low-power] .background-sample:not([data-background='none'])");
    expect(css).toMatch(/html\[data-low-power\]\[data-background\]::before[^{]*\{\s*display: none/);
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)[\s\S]*display: none/);
  });
});
