/**
 * The user avatar: a Bit generated from the username (scheme C, design-system/qhhoj/mascot.md, Avatar).
 * Pure functions only: hash, digit picks, the 16x16 pixel grid, and its scaling to a pixel size.
 * The body rows and the outline rule come from bit-sprite.ts; the avatar-only data from avatar-sprites.ts.
 */
import { BODY, LEGS_STAND, SPRITE_SIZE, withOutline } from '../bit-sprite';
import type { PixelRole } from '../bit-sprite';
import {
  AVATAR_EYES,
  AVATAR_FIXED_PALETTE,
  AVATAR_FIXED_TILE,
  AVATAR_HATS,
  AVATAR_PALETTES,
  AVATAR_PATTERNS,
  AVATAR_TILES,
  NO_HAT,
  NO_PATTERN,
} from './avatar-sprites';
import type {
  AvatarEyes,
  AvatarHat,
  AvatarPalette,
  AvatarPattern,
  AvatarTile,
} from './avatar-sprites';

/** The sizes the product shows an avatar at: 24, 28 and 32 in lists and bars, 96 and 128 on profiles. */
export type AvatarSize = 24 | 28 | 32 | 96 | 128;
/** `banned` and `deleted` get the fixed look; `active` gets the one hashed from the username. */
export type AvatarStatus = 'active' | 'banned' | 'deleted';

export interface AvatarLook {
  palette: AvatarPalette;
  hat: AvatarHat;
  tile: AvatarTile;
  pattern: AvatarPattern;
  eyes: AvatarEyes;
}

/** A cell is the colour of a filled pixel, or null for transparent. */
export type AvatarPixels = readonly (readonly (string | null)[])[];

/** A run of one colour, in pixels of the target size. */
export interface AvatarRect {
  x: number;
  y: number;
  width: number;
  height: number;
  colour: string;
}

const FNV_OFFSET_BASIS = 0x811c9dc5;
const FNV_PRIME = 0x01000193;

/** FNV-1a 32-bit over the bytes; each step multiplies modulo 2^32. */
const fnv1a32 = (bytes: Uint8Array): number => {
  let hash = FNV_OFFSET_BASIS;
  for (const byte of bytes) hash = Math.imul(hash ^ byte, FNV_PRIME) >>> 0;
  return hash;
};

/** The murmur3 finaliser: spreads every input bit over the output. */
const fmix32 = (input: number): number => {
  let hash = input;
  hash ^= hash >>> 16;
  hash = Math.imul(hash, 0x85ebca6b) >>> 0;
  hash ^= hash >>> 13;
  hash = Math.imul(hash, 0xc2b2ae35) >>> 0;
  return (hash ^ (hash >>> 16)) >>> 0;
};

/** fmix32(FNV-1a-32(UTF-8(NFC(username).toLowerCase()))): the same name always gives the same hash. */
export const avatarHash = (username: string): number =>
  fmix32(fnv1a32(new TextEncoder().encode(username.normalize('NFC').toLowerCase())));

/** Mixed-radix digits, lowest first: digit = value mod radix, then value = floor(value / radix). */
export const mixedRadixDigits = (value: number, radices: readonly number[]): number[] => {
  let rest = value;
  return radices.map((radix) => {
    const digit = rest % radix;
    rest = Math.floor(rest / radix);
    return digit;
  });
};

/** The look a username gets, in the digit order of scheme C: palette 12, hat 16, tile 8, pattern 4, eyes 4. */
export const bitAvatarFor = (username: string): AvatarLook => {
  const [palette, hat, tile, pattern, eyes] = mixedRadixDigits(avatarHash(username), [
    AVATAR_PALETTES.length,
    AVATAR_HATS.length,
    AVATAR_TILES.length,
    AVATAR_PATTERNS.length,
    AVATAR_EYES.length,
  ]);
  return {
    palette: AVATAR_PALETTES[palette!]!,
    hat: AVATAR_HATS[hat!]!,
    tile: AVATAR_TILES[tile!]!,
    pattern: AVATAR_PATTERNS[pattern!]!,
    eyes: AVATAR_EYES[eyes!]!,
  };
};

/** The fixed grey look for banned and deleted accounts; any other status hashes the username. */
export const avatarLook = (username: string, status: AvatarStatus = 'active'): AvatarLook =>
  status === 'active'
    ? bitAvatarFor(username)
    : {
        palette: AVATAR_FIXED_PALETTE,
        hat: NO_HAT,
        tile: AVATAR_FIXED_TILE,
        pattern: NO_PATTERN,
        eyes: 'closed',
      };

const EMPTY_ROW = '.'.repeat(SPRITE_SIZE);

/** Closes one eye column: the top eye pixel becomes body, the bottom one shade (the blink). */
const closeEyeColumn = (rows: string[][], column: number) => {
  rows[8]![column] = 'B';
  rows[9]![column] = 'S';
};

/** Eyes on rows 8-9 (eye pixels at columns 5 and 9): open, closed, one wink, or a side glance. */
const applyEyes = (rows: string[][], eyes: AvatarEyes) => {
  if (eyes === 'closed') {
    closeEyeColumn(rows, 5);
    closeEyeColumn(rows, 9);
  }
  if (eyes === 'wink') closeEyeColumn(rows, 5);
  if (eyes === 'side') {
    for (const row of [8, 9]) {
      rows[row]![5] = 'B';
      rows[row]![9] = 'B';
      rows[row]![6] = 'E';
      rows[row]![10] = 'E';
    }
  }
};

/** The 16x16 role grid (`.` transparent, `O` outline) of a look, before its colours are applied. */
export const avatarRoleRows = (look: AvatarLook): string[] => {
  const grid = [
    ...look.hat.rows,
    ...BODY,
    LEGS_STAND,
    LEGS_STAND,
    LEGS_STAND,
    EMPTY_ROW,
    EMPTY_ROW,
  ].map((row) => [...row]);
  for (const [row, column, role] of look.pattern.cells) grid[row]![column] = role;
  applyEyes(grid, look.eyes);
  return withOutline(grid.map((row) => row.join('')));
};

/** The 16x16 colour grid of a look: each filled role takes its palette colour. */
export const avatarPixels = (look: AvatarLook): AvatarPixels =>
  avatarRoleRows(look).map((row) =>
    [...row].map((role) => (role === '.' ? null : look.palette[role as PixelRole])),
  );

/**
 * The grid scaled to `size` pixels, the way bit-sprite's renderer does it: cell edges at floor(i * size / 16),
 * and each row's runs of one colour merged into a single rect.
 */
export const avatarRects = (pixels: AvatarPixels, size: number): AvatarRect[] => {
  const edge = (index: number) => Math.floor((index * size) / SPRITE_SIZE);
  const rects: AvatarRect[] = [];
  pixels.forEach((cells, rowIndex) => {
    let column = 0;
    while (column < SPRITE_SIZE) {
      const colour = cells[column]!;
      let runEnd = column + 1;
      while (runEnd < SPRITE_SIZE && cells[runEnd] === colour) runEnd++;
      if (colour !== null)
        rects.push({
          x: edge(column),
          y: edge(rowIndex),
          width: edge(runEnd) - edge(column),
          height: edge(rowIndex + 1) - edge(rowIndex),
          colour,
        });
      column = runEnd;
    }
  });
  return rects.filter((rect) => rect.width > 0 && rect.height > 0);
};
