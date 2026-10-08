/**
 * Avatar-only sprite data (scheme C of the avatar design board; design-system/qhhoj/mascot.md, Avatar).
 * Hats, palettes, tiles, patterns and eye styles exist only for avatars; the body rows and the outline rule are
 * shared with bit-sprite.ts. The order of each list is the digit order of the hash, so never reorder or insert.
 * Colour literals here are sprite data, not theme tokens; scripts/check-tokens.mjs skips this file by name.
 */
import { SPRITE_SIZE } from '../bit-sprite';
import type { PixelRole } from '../bit-sprite';

const EMPTY_ROW = '.'.repeat(SPRITE_SIZE);
const HAT_ROWS = 6;

/** Pads a hat shape from the top so that its last row sits directly above the body (row 6). */
const hatRows = (...rows: string[]): string[] => [
  ...Array<string>(HAT_ROWS - rows.length).fill(EMPTY_ROW),
  ...rows,
];

/** No hat: the default, and the fixed look's. */
export const NO_HAT = { name: 'none', rows: hatRows() };

/** Digit 1 (radix 16). Rows 0-5 only. */
export const AVATAR_HATS = [
  NO_HAT,
  {
    name: 'cap',
    rows: hatRows('..AAAAAAAAAAA...', '....AAAAAAA..A..', '....AAAAAAA..A..'),
  },
  { name: 'crown', rows: hatRows('....A..A..A.....', '....AAAAAAA.....') },
  {
    name: 'antenna',
    rows: hatRows('.......AA.......', '.......AA.......', '.......A........', '.......A........'),
  },
  {
    name: 'nightcap',
    rows: hatRows('.....AAAAA......', '....AAAAAAA.....', '...AAAAAAAAA....'),
  },
  {
    name: 'beret',
    rows: hatRows('........A.......', '....AAAAAAA.....', '..AAAAAAAAAA....', '...AAAAAAAAA....'),
  },
  { name: 'headband', rows: hatRows('..............A.', '.............AA.', '...AAAAAAAAAA...') },
  {
    name: 'hardhat',
    rows: hatRows('......AHA.......', '.....AAHAA......', '....AAAHAAA.....', '..AAAAAAAAAAA...'),
  },
  {
    name: 'party',
    rows: hatRows(
      '.......A........',
      '.......A........',
      '......AHA.......',
      '......HAA.......',
      '.....AAHAA......',
      '.....AHAAHA.....',
    ),
  },
  {
    name: 'headset',
    rows: hatRows('.....AAAAA......', '....A.....A.....', '...A.......A....', '..HH........HH..'),
  },
  {
    name: 'flame',
    rows: hatRows(
      '.......A........',
      '......AAA.......',
      '....A.AHA.......',
      '....AAAHAA......',
      '.....AHHHA......',
      '.....AAAAA......',
    ),
  },
  {
    name: 'gear',
    rows: hatRows(
      '......A.A.......',
      '.....AAAAA......',
      '....AAAOAAA.....',
      '.....AAAAA......',
      '......A.A.......',
      '.......A........',
    ),
  },
  {
    name: 'pennant',
    rows: hatRows(
      '.......OAAAA....',
      '.......OAAA.....',
      '.......OAA......',
      '.......OA.......',
      '.......O........',
      '.......O........',
    ),
  },
  {
    name: 'heart',
    rows: hatRows(
      '.....HH.HH......',
      '....HHHHHHH.....',
      '.....HHHHH......',
      '......HHH.......',
      '.......H........',
    ),
  },
  {
    name: 'sprout',
    rows: hatRows('.....AA.AA......', '......AAA.......', '.......A........'),
  },
  { name: 'bow', rows: hatRows('...AA.AA........', '...AAAAA........', '...AA.AA........') },
] as const;
export type AvatarHat = (typeof AVATAR_HATS)[number];

/** Digit 0 (radix 12): the body colours by role; `O` is the outline, `E` the eye. */
export interface AvatarPalette extends Record<PixelRole, string> {
  name: string;
}
export const AVATAR_PALETTES: readonly AvatarPalette[] = [
  {
    name: 'terracotta',
    O: '#5A2A18',
    B: '#D97757',
    S: '#B85C3D',
    H: '#F4B89C',
    E: '#1F1E1D',
    A: '#F2C14E',
  },
  {
    name: 'marigold',
    O: '#5C3A08',
    B: '#E3A83A',
    S: '#C08A22',
    H: '#F6D58F',
    E: '#1F1E1D',
    A: '#3F82B8',
  },
  {
    name: 'leaf',
    O: '#2B4A16',
    B: '#8DBA4A',
    S: '#6E9A33',
    H: '#CDE6A0',
    E: '#1F1E1D',
    A: '#F2C14E',
  },
  {
    name: 'jade',
    O: '#163F2E',
    B: '#4FAF7E',
    S: '#3A8F63',
    H: '#A9DDBF',
    E: '#1F1E1D',
    A: '#F2C14E',
  },
  {
    name: 'teal',
    O: '#123F3D',
    B: '#3AA7A0',
    S: '#2A8781',
    H: '#9FDCD6',
    E: '#1F1E1D',
    A: '#F2C14E',
  },
  {
    name: 'sky',
    O: '#18344F',
    B: '#5A9FD6',
    S: '#3F82B8',
    H: '#AFD2EE',
    E: '#1F1E1D',
    A: '#F2C14E',
  },
  {
    name: 'indigo',
    O: '#23244F',
    B: '#8189DB',
    S: '#6168BD',
    H: '#C3C7F2',
    E: '#1F1E1D',
    A: '#F2C14E',
  },
  {
    name: 'violet',
    O: '#3A2152',
    B: '#A57FD8',
    S: '#8660BA',
    H: '#D8C5F1',
    E: '#1F1E1D',
    A: '#F2C14E',
  },
  {
    name: 'orchid',
    O: '#4D1A45',
    B: '#CF72BE',
    S: '#AE559F',
    H: '#EDBCE4',
    E: '#1F1E1D',
    A: '#F2C14E',
  },
  {
    name: 'rose',
    O: '#551A2C',
    B: '#E06C8C',
    S: '#BE4F6F',
    H: '#F5B9C9',
    E: '#1F1E1D',
    A: '#F2C14E',
  },
  {
    name: 'sand',
    O: '#4A3820',
    B: '#C9AE84',
    S: '#A88E65',
    H: '#EADCC4',
    E: '#1F1E1D',
    A: '#D97757',
  },
  {
    name: 'slate',
    O: '#1F2933',
    B: '#8D9BAE',
    S: '#6F7D91',
    H: '#C9D2DC',
    E: '#1F1E1D',
    A: '#F2C14E',
  },
];

/** Digit 2 (radix 8): the square behind the body. */
export interface AvatarTile {
  name: string;
  colour: string;
}
export const AVATAR_TILES: readonly AvatarTile[] = [
  { name: 'sand', colour: '#EFE6D6' },
  { name: 'sage', colour: '#D7E8D3' },
  { name: 'sky', colour: '#D3E3F1' },
  { name: 'butter', colour: '#F6E4A9' },
  { name: 'lavender', colour: '#E4DAF1' },
  { name: 'mint', colour: '#CDEBE3' },
  { name: 'peach', colour: '#F6D9CF' },
  { name: 'stone', colour: '#DEDAD2' },
];

/** Digit 3 (radix 4): small marks on the body. `cells` are [row, column, role]. */
export interface AvatarPattern {
  name: string;
  cells: readonly (readonly [number, number, PixelRole])[];
}
/** No pattern: the default, and the fixed look's. */
export const NO_PATTERN: AvatarPattern = { name: 'none', cells: [] };

export const AVATAR_PATTERNS: readonly AvatarPattern[] = [
  NO_PATTERN,
  {
    name: 'patch',
    cells: [
      [6, 10, 'S'],
      [6, 11, 'S'],
      [7, 11, 'S'],
    ],
  },
  {
    name: 'stripe',
    cells: [3, 4, 5, 6, 7, 8, 9, 10, 11].map((column) => [7, column, 'S'] as const),
  },
  {
    name: 'blush',
    cells: [
      [9, 4, 'H'],
      [9, 10, 'H'],
    ],
  },
];

/** Digit 4 (radix 4): what the eyes look like. Applied on the body's eye pixels (rows 8-9). */
export const AVATAR_EYES = ['open', 'closed', 'wink', 'side'] as const;
export type AvatarEyes = (typeof AVATAR_EYES)[number];

/** Banned and deleted accounts: one fixed grey Bit, no hat, closed eyes, on a grey tile. */
export const AVATAR_FIXED_PALETTE: AvatarPalette = {
  name: 'grey',
  O: '#4A4640',
  B: '#B4AFA5',
  S: '#9A958B',
  H: '#DDD9D1',
  E: '#4A4640',
  A: '#B4AFA5',
};
export const AVATAR_FIXED_TILE: AvatarTile = { name: 'grey', colour: '#E8E2D8' };
