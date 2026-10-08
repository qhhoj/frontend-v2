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

/** The picks the design board's own code gives (scheme C), computed by running its JS under node. */
const GOLDEN = [
  {
    username: 'minhthu',
    hash: 626089597,
    palette: 'marigold',
    hat: 'beret',
    tile: 'butter',
    pattern: 'stripe',
    eyes: 'wink',
  },
  {
    username: 'tuan_k',
    hash: 2221472418,
    palette: 'indigo',
    hat: 'heart',
    tile: 'sand',
    pattern: 'blush',
    eyes: 'side',
  },
  {
    username: 'ngoc_anh',
    hash: 1759798237,
    palette: 'marigold',
    hat: 'heart',
    tile: 'stone',
    pattern: 'patch',
    eyes: 'closed',
  },
  {
    username: 'hoangnam_10a',
    hash: 728219869,
    palette: 'marigold',
    hat: 'heart',
    tile: 'butter',
    pattern: 'patch',
    eyes: 'closed',
  },
  {
    username: 'hoangnam_10q',
    hash: 1808711460,
    palette: 'terracotta',
    hat: 'antenna',
    tile: 'lavender',
    pattern: 'stripe',
    eyes: 'wink',
  },
  {
    username: 'e2e_user',
    hash: 2139093632,
    palette: 'orchid',
    hat: 'flame',
    tile: 'sand',
    pattern: 'blush',
    eyes: 'side',
  },
] as const;

/** Role grids (`.` transparent, `O` outline) of three looks, from the board's bitRows. */
const GOLDEN_ROWS: Record<string, readonly string[]> = {
  minhthu: [
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
    expect(bitAvatarFor('Minhthu')).toEqual(bitAvatarFor('minhthu'));
    expect(bitAvatarFor('HOANGNAM_10A')).toEqual(bitAvatarFor('hoangnam_10a'));
  });

  it('gives the same hash for the NFC and NFD spellings of one name', () => {
    const composed = 'thư'; // "thư" with one precomposed letter
    const decomposed = 'thư'; // the same letter as u plus a combining horn
    expect(composed).not.toBe(decomposed);
    expect(avatarHash(composed)).toBe(avatarHash(decomposed));
    expect(bitAvatarFor(composed)).toEqual(bitAvatarFor(decomposed));
  });

  it('reproduces the board picks for the six sample names', () => {
    for (const sample of GOLDEN) {
      expect(avatarHash(sample.username)).toBe(sample.hash);
      const look = bitAvatarFor(sample.username);
      expect({
        palette: look.palette.name,
        hat: look.hat.name,
        tile: look.tile.name,
        pattern: look.pattern.name,
        eyes: look.eyes,
      }).toEqual({
        palette: sample.palette,
        hat: sample.hat,
        tile: sample.tile,
        pattern: sample.pattern,
        eyes: sample.eyes,
      });
    }
  });

  it('gives hoangnam_10a and hoangnam_10q different Bits', () => {
    expect(avatarHash('hoangnam_10a')).not.toBe(avatarHash('hoangnam_10q'));
    expect(bitAvatarFor('hoangnam_10a')).not.toEqual(bitAvatarFor('hoangnam_10q'));
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
      const look = avatarLook('minhthu', status);
      expect(avatarLook('someone_else', status)).toEqual(look);
      expect(look.hat.name).toBe('none');
      expect(look.eyes).toBe('closed');
      expect(look.tile).toBe(AVATAR_FIXED_TILE);
      expect(look.palette.name).toBe('grey');
    }
  });

  it('leaves an active account on its hashed look', () => {
    expect(avatarLook('minhthu', 'active')).toEqual(bitAvatarFor('minhthu'));
    expect(avatarLook('minhthu')).toEqual(bitAvatarFor('minhthu'));
    expect(avatarLook('minhthu', 'banned')).not.toEqual(bitAvatarFor('minhthu'));
  });
});

describe('avatarRoleRows and avatarPixels', () => {
  it('draws the board grids for three samples, hat, pattern and eyes included', () => {
    for (const [username, rows] of Object.entries(GOLDEN_ROWS))
      expect(avatarRoleRows(bitAvatarFor(username))).toEqual(rows);
  });

  it('shares the body, legs and outline with bit-sprite (open eyes, no hat, no pattern)', () => {
    const plain: AvatarLook = {
      ...bitAvatarFor('minhthu'),
      hat: NO_HAT,
      pattern: NO_PATTERN,
      eyes: 'open',
    };
    expect(avatarRoleRows(plain)).toEqual(bitFrame({ headgear: 'none' }));
  });

  it('closes both eyes exactly as bit-sprite blinks them', () => {
    const closed: AvatarLook = {
      ...bitAvatarFor('minhthu'),
      hat: NO_HAT,
      pattern: NO_PATTERN,
      eyes: 'closed',
    };
    expect(avatarRoleRows(closed)).toEqual(bitFrame({ headgear: 'none', blinking: true }));
  });

  it('colours each filled pixel from its palette and leaves the rest transparent', () => {
    const look = bitAvatarFor('tuan_k');
    const rows = avatarRoleRows(look);
    const pixels = avatarPixels(look);
    expect(pixels).toHaveLength(16);
    rows.forEach((row, rowIndex) =>
      [...row].forEach((role, column) => {
        const expected = role === '.' ? null : look.palette[role as 'O'];
        expect(pixels[rowIndex]![column]).toBe(expected);
      }),
    );
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

  it('keeps the last column and row: a lone corner pixel and a full grid both keep their area', () => {
    const blank = (): (string | null)[][] =>
      Array.from({ length: 16 }, () => Array<string | null>(16).fill(null));
    const corner = blank();
    corner[15]![15] = '#000000';
    for (const size of SIZES) {
      const edge = Math.floor((15 * size) / 16);
      expect(avatarRects(corner, size)).toEqual([
        { x: edge, y: edge, width: size - edge, height: size - edge, colour: '#000000' },
      ]);
    }
    const full = blank().map((row) => row.map(() => '#000000'));
    for (const size of SIZES) {
      const area = avatarRects(full, size).reduce((sum, rect) => sum + rect.width * rect.height, 0);
      expect(area).toBe(size * size);
    }
  });

  it('draws whole pixels at 32, 96 and 128 px: each cell is size / 16 pixels square', () => {
    const pixels = avatarPixels(bitAvatarFor('minhthu'));
    for (const size of [32, 96, 128]) {
      const rects = avatarRects(pixels, size);
      for (const rect of rects) {
        expect(rect.x % (size / 16)).toBe(0);
        expect(rect.width % (size / 16)).toBe(0);
      }
    }
  });
});
