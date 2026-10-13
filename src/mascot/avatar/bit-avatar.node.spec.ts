import { describe, expect, it } from 'vitest';
import { bitFrame } from '../bit-sprite';
import { AVATAR_FIXED_TILE, NO_HAT, NO_PATTERN } from './avatar-sprites';
import {
  avatarHash,
  avatarLook,
  avatarPixels,
  avatarRects,
  avatarRoleRows,
  bitAvatarFor,
  mixedRadixDigits,
} from './bit-avatar';
import type { AvatarLook } from './bit-avatar';

const RADICES = [12, 16, 8, 4, 4];
const SIZES = [24, 28, 32, 96, 128] as const;

/** Role grids (`.` transparent, `O` outline) of three looks, from the board's bitRows. */
const GOLDEN_ROWS: Record<string, readonly string[]> = {
  bitcoder: [
    '................',
    '........O.......',
    '....OOOOAOO.....',
    '..OOAAAAAAAO....',
    '.OAAAAAAAAAAO...',
    '..OAAAAAAAAAO...',
    '..OHBBBBBBBBBO..',
    '..OSSSSSSSSSO...',
    '.OBBBBBBBEBBBO..',
    '..OBBSBBBEBBO...',
    '..OSSSSSSSSSO...',
    '...OOOOOOOOO....',
    '...O.O...O.O....',
    '...O.O...O.O....',
    '................',
    '................',
  ],
  tuan_k: [
    '.....OO.OO......',
    '....OHHOHHO.....',
    '...OHHHHHHHO....',
    '....OHHHHHO.....',
    '.....OHHHO......',
    '...OOOOHOOOOO...',
    '..OHBBBBBBBBBO..',
    '..OBBBBBBBBBO...',
    '.OBBBBEBBBEBBO..',
    '..OBHBEBBBEBO...',
    '..OSSSSSSSSSO...',
    '...OOOOOOOOO....',
    '...O.O...O.O....',
    '...O.O...O.O....',
    '................',
    '................',
  ],
  hoangnam_10a: [
    '.....OO.OO......',
    '....OHHOHHO.....',
    '...OHHHHHHHO....',
    '....OHHHHHO.....',
    '.....OHHHO......',
    '...OOOOHOOOOO...',
    '..OHBBBBBBSSBO..',
    '..OBBBBBBBBSO...',
    '.OBBBBBBBBBBBO..',
    '..OBBSBBBSBBO...',
    '..OSSSSSSSSSO...',
    '...OOOOOOOOO....',
    '...O.O...O.O....',
    '...O.O...O.O....',
    '................',
    '................',
  ],
};

const countFilled = (grid: readonly (readonly (string | null)[])[]) =>
  grid.flat().filter((cell) => cell !== null).length;

describe('avatarHash and bitAvatarFor', () => {
  it('gives the same look for the same username, whatever its case', () => {
    expect(bitAvatarFor('Bitcoder')).toEqual(bitAvatarFor('bitcoder'));
    expect(bitAvatarFor('HOANGNAM_10A')).toEqual(bitAvatarFor('hoangnam_10a'));
  });

  it('gives the same hash for the NFC and NFD spellings of one name', () => {
    const composed = 'thư'; // "thư" with one precomposed letter
    const decomposed = 'thư'; // the same letter as u plus a combining horn
    expect(composed).not.toBe(decomposed);
    expect(avatarHash(composed)).toBe(avatarHash(decomposed));
    expect(bitAvatarFor(composed)).toEqual(bitAvatarFor(decomposed));
  });
});

describe('mixedRadixDigits', () => {
  it('reads the value as digits, lowest first, and rebuilds it exactly', () => {
    expect(mixedRadixDigits(13, [12, 16])).toEqual([1, 1]);
    expect(mixedRadixDigits(0, RADICES)).toEqual([0, 0, 0, 0, 0]);
    for (const value of [1, 4095, 24575, 2 ** 31 + 7]) {
      const digits = mixedRadixDigits(value, RADICES);
      let weight = 1;
      let rebuilt = 0;
      digits.forEach((digit, index) => {
        expect(digit).toBeGreaterThanOrEqual(0);
        expect(digit).toBeLessThan(RADICES[index]!);
        rebuilt += digit * weight;
        weight *= RADICES[index]!;
      });
      expect(rebuilt).toBe(value % weight);
    }
  });
});

describe('avatarLook for banned and deleted accounts', () => {
  it('gives every banned or deleted account the same fixed look, whoever the name is', () => {
    for (const status of ['banned', 'deleted'] as const) {
      const look = avatarLook('bitcoder', status);
      expect(avatarLook('someone_else', status)).toEqual(look);
      expect(look.hat.name).toBe('none');
      expect(look.eyes).toBe('closed');
      expect(look.tile).toBe(AVATAR_FIXED_TILE);
      expect(look.palette.name).toBe('grey');
    }
  });
});

describe('avatarRoleRows and avatarPixels', () => {
  it('shares the body, legs and outline with bit-sprite (open eyes, no hat, no pattern)', () => {
    const plain: AvatarLook = {
      ...bitAvatarFor('bitcoder'),
      hat: NO_HAT,
      pattern: NO_PATTERN,
      eyes: 'open',
    };
    expect(avatarRoleRows(plain)).toEqual(bitFrame({ headgear: 'none' }));
  });
});

describe('avatarRects', () => {
  it('covers exactly the filled area at every size, so no pixel is lost or doubled', () => {
    for (const username of Object.keys(GOLDEN_ROWS).concat('ngoc_anh')) {
      const pixels = avatarPixels(bitAvatarFor(username));
      const filledCells = countFilled(pixels);
      for (const size of SIZES) {
        const rects = avatarRects(pixels, size);
        const area = rects.reduce((sum, rect) => sum + rect.width * rect.height, 0);
        const expected = pixels.reduce(
          (sum, cells, rowIndex) =>
            sum +
            cells.reduce((rowSum, cell, column) => {
              if (cell === null) return rowSum;
              const width =
                Math.floor(((column + 1) * size) / 16) - Math.floor((column * size) / 16);
              const height =
                Math.floor(((rowIndex + 1) * size) / 16) - Math.floor((rowIndex * size) / 16);
              return rowSum + width * height;
            }, 0),
          0,
        );
        expect(area).toBe(expected);
        expect(filledCells).toBeGreaterThan(0);
        for (const rect of rects) {
          expect(rect.x).toBeGreaterThanOrEqual(0);
          expect(rect.y).toBeGreaterThanOrEqual(0);
          expect(rect.x + rect.width).toBeLessThanOrEqual(size);
          expect(rect.y + rect.height).toBeLessThanOrEqual(size);
        }
      }
    }
  });
});
