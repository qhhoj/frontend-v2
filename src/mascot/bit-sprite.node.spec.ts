import { describe, expect, it } from 'vitest';
import { SPRITE_SIZE, bitFrame, withOutline } from './bit-sprite';
import type { BitHeadgear } from './bit-sprite';

const HEADGEARS: BitHeadgear[] = ['none', 'cap', 'crown', 'antenna', 'nightcap', 'sweat'];
const ROLES = new Set(['.', 'O', 'B', 'S', 'H', 'E', 'A']);
const EMPTY_ROW = '.'.repeat(SPRITE_SIZE);

describe('bitFrame', () => {
  it('is always 16 rows of 16 known roles, with a transparent border for the outline to fit', () => {
    for (const headgear of HEADGEARS)
      for (const step of [false, true])
        for (const blinking of [false, true])
          for (const tears of [false, true]) {
            const frame = bitFrame({ headgear, step, blinking, tears });
            expect(frame).toHaveLength(SPRITE_SIZE);
            for (const row of frame) {
              expect(row).toHaveLength(SPRITE_SIZE);
              for (const role of row) expect(ROLES.has(role)).toBe(true);
            }
            expect(frame[0]).toBe(EMPTY_ROW);
            expect(frame[SPRITE_SIZE - 1]).toBe(EMPTY_ROW);
            for (const row of frame) expect([row[0], row.at(-1)]).toEqual(['.', '.']);
          }
  });
});

describe('withOutline', () => {
  it('outlines every transparent pixel that touches a filled pixel on its four sides', () => {
    expect(withOutline(['...', '.B.', '...'])).toEqual(['.O.', 'OBO', '.O.']);
  });

  it('does not outline diagonally', () => {
    expect(withOutline(['B..', '...', '...'])).toEqual(['BO.', 'O..', '...']);
  });

  it('does not outline around outline pixels (legs are outline-coloured)', () => {
    expect(withOutline(['.O.'])).toEqual(['.O.']);
  });
});
