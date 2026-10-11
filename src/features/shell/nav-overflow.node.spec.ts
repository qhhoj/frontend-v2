import { describe, expect, it } from 'vitest';
import { scrollToClearFade, splitNavItems } from './nav-overflow';

const WIDTHS = [60, 80, 70, 90, 100]; // gap 2: the row is 400 + 8 = 408
const base = { widths: WIDTHS, moreWidth: 50, gap: 2, activeIndex: -1 };

describe('splitNavItems', () => {
  it('moves the trailing items into the menu, leaving room for the More button', () => {
    // budget 300 - 52 = 248: 60 + 2 + 80 + 2 + 70 = 214 fits, adding 90 does not
    expect(splitNavItems({ ...base, available: 300 })).toEqual({
      visible: [0, 1, 2],
      hidden: [3, 4],
    });
  });

  it('lets the active item take the place of the last item that fits', () => {
    // budget 248: [60, 80] + 2 + the active 100 = 244 fits, [60, 80, 70] would not
    expect(splitNavItems({ ...base, available: 300, activeIndex: 4 })).toEqual({
      visible: [0, 1, 4],
      hidden: [2, 3],
    });
  });

  it('keeps an active item that already fits where it is', () => {
    expect(splitNavItems({ ...base, available: 300, activeIndex: 1 })).toEqual({
      visible: [0, 1, 2],
      hidden: [3, 4],
    });
  });

  it('shows only the active item when nothing else fits beside it', () => {
    expect(splitNavItems({ ...base, available: 170, activeIndex: 3 })).toEqual({
      visible: [3],
      hidden: [0, 1, 2, 4],
    });
  });

  it('hides everything but the menu when no item fits', () => {
    expect(splitNavItems({ ...base, available: 60 })).toEqual({
      visible: [],
      hidden: [0, 1, 2, 3, 4],
    });
  });
});

describe('scrollToClearFade', () => {
  const strip = { scrollLeft: 100, viewWidth: 300, fadeWidth: 24 };

  it('scrolls back until an item hidden under the left fade clears it', () => {
    expect(scrollToClearFade({ ...strip, left: 110, right: 180 })).toBe(86);
  });

  it('scrolls on until an item under the right fade clears it', () => {
    expect(scrollToClearFade({ ...strip, left: 330, right: 390 })).toBe(114);
  });
});
