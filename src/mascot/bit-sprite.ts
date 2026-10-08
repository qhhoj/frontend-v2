/**
 * Bit, the QHHOJ pixel mascot (design-system/qhhoj/mascot.md): 16x16 grid data and the pure functions that turn it into frames.
 * The palettes below are sprite colours, not theme tokens: Bit keeps them in every theme, so this is the one source file
 * (besides src/theme/themes/*.css) allowed to hold colour literals; scripts/check-tokens.mjs skips it by name.
 */
export const SPRITE_SIZE = 16;

export const BIT_PALETTES = {
  terracotta: {
    O: '#5A2A18',
    B: '#D97757',
    S: '#B85C3D',
    H: '#F4B89C',
    E: '#1F1E1D',
    A: '#F2C14E',
  },
  charcoal: { O: '#121110', B: '#3D3A36', S: '#2A2825', H: '#6B6660', E: '#F0A27E', A: '#C9A227' },
} as const;
export type BitPaletteName = keyof typeof BIT_PALETTES;
export type PixelRole = keyof (typeof BIT_PALETTES)['terracotta'];

export type BitHeadgear = 'none' | 'cap' | 'crown' | 'antenna' | 'nightcap' | 'sweat';
export interface BitLook {
  headgear: BitHeadgear;
  palette: BitPaletteName;
}
/** The loading swarm takes the first 5 (desktop) or 3 (phone). */
export const BIT_LOOKS: readonly BitLook[] = [
  { headgear: 'cap', palette: 'terracotta' },
  { headgear: 'nightcap', palette: 'charcoal' },
  { headgear: 'crown', palette: 'terracotta' },
  { headgear: 'antenna', palette: 'terracotta' },
  { headgear: 'none', palette: 'terracotta' },
];

/** Where Bit appears (mascot.md, Variants); eyes are closed or blinking per placement, not part of the look. */
export const PLACEMENT_LOOKS = {
  hero: { headgear: 'cap', palette: 'terracotta' },
  accepted: { headgear: 'crown', palette: 'terracotta' },
  rejected: { headgear: 'sweat', palette: 'terracotta' },
  emptyList: { headgear: 'nightcap', palette: 'charcoal' },
} as const satisfies Record<string, BitLook>;

const EMPTY_ROW = '.'.repeat(SPRITE_SIZE);
const HEADGEAR_ROWS = 6;
/** Pads the headgear shape from the top so that its last row sits directly above the body (row 6). */
const headgearRows = (...rows: string[]) => [
  ...Array<string>(HEADGEAR_ROWS - rows.length).fill(EMPTY_ROW),
  ...rows,
];
/** Rows 0-5 only; each shape sits on the body's first row (row 6). */
const HEADGEAR: Record<BitHeadgear, readonly string[]> = {
  none: headgearRows(),
  cap: headgearRows('..AAAAAAAAAAA...', '....AAAAAAA..A..', '....AAAAAAA..A..'),
  crown: headgearRows('....A..A..A.....', '....AAAAAAA.....'),
  antenna: headgearRows(
    '.......AA.......',
    '.......AA.......',
    '.......A........',
    '.......A........',
  ),
  /** A sweat drop in the highlight colour beside the head. */
  sweat: headgearRows('............H...', '...........HH...'),
  nightcap: headgearRows('.....AAAAA......', '....AAAAAAA.....', '...AAAAAAAAA....'),
};

/** Rows 6-10: highlight, body, side nubs with eyes, body, shade. */
export const BODY = [
  '...HBBBBBBBBB...',
  '...BBBBBBBBB....',
  '..BBBEBBBEBBB...',
  '...BBEBBBEBB....',
  '...SSSSSSSSS....',
];
export const LEGS_STAND = '...O.O...O.O....';
const LEGS_STEP = '....O.O.O.O.....';

export interface BitPose {
  headgear: BitHeadgear;
  /** Second leg frame; the whole sprite also bobs one pixel down. */
  step?: boolean;
  /** With `step`: leave the whole sprite where it is (default false: shift it one row down). The renderer then bobs it with a transform. */
  keepPosition?: boolean;
  /** Eyes closed (also the crying eyes). */
  blinking?: boolean;
  /** A highlight tear pixel under each eye (apply with `blinking`). */
  tears?: boolean;
}

const isFilled = (role: string | undefined) => role !== undefined && role !== '.' && role !== 'O';
/** Four-neighbourhood as [columnStep, rowStep]; diagonals never count. */
const NEIGHBOUR_STEPS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
] as const;

/** Adds the 1 px outline on every transparent pixel whose four-neighbourhood holds a filled, non-outline pixel. */
export const withOutline = (rows: readonly string[]): string[] =>
  rows.map((row, rowIndex) =>
    [...row]
      .map((role, columnIndex) => {
        if (role !== '.') return role;
        const touchesFilled = NEIGHBOUR_STEPS.some(([columnStep, rowStep]) =>
          isFilled(rows[rowIndex + rowStep]?.[columnIndex + columnStep]),
        );
        return touchesFilled ? 'O' : '.';
      })
      .join(''),
  );

/** Top eye pixel becomes body, bottom eye pixel becomes shade. */
const closeEyes = (rows: readonly string[]) =>
  rows.map((row, rowIndex) =>
    [...row]
      .map((role, columnIndex) => {
        if (role !== 'E') return role;
        return rows[rowIndex - 1]?.[columnIndex] === 'E' ? 'S' : 'B';
      })
      .join(''),
  );

/** Highlight pixel directly under each eye. */
const addTears = (rows: readonly string[]) =>
  rows.map((row, rowIndex) =>
    [...row]
      .map((role, columnIndex) =>
        rows[rowIndex - 1]?.[columnIndex] === 'E' && role !== 'E' ? 'H' : role,
      )
      .join(''),
  );

/** One 16x16 frame of role characters (`.` is transparent). */
export const bitFrame = ({
  headgear,
  step = false,
  keepPosition = false,
  blinking = false,
  tears = false,
}: BitPose) => {
  const legs = step ? LEGS_STEP : LEGS_STAND;
  let rows = [...HEADGEAR[headgear], ...BODY, legs, legs, legs, EMPTY_ROW, EMPTY_ROW];
  if (tears) rows = addTears(rows);
  if (blinking) rows = closeEyes(rows);
  rows = withOutline(rows);
  return step && !keepPosition ? [EMPTY_ROW, ...rows.slice(0, -1)] : rows;
};

export interface SpriteCell {
  column: number;
  row: number;
  colour: string;
}

/** The filled pixels of a frame as CSS grid cells (1-based lines) with their palette colour. */
export const spriteCells = (
  frame: readonly string[],
  palette: BitPaletteName = 'terracotta',
): SpriteCell[] =>
  frame.flatMap((row, rowIndex) =>
    [...row].flatMap((role, columnIndex) =>
      role === '.'
        ? []
        : [
            {
              column: columnIndex + 1,
              row: rowIndex + 1,
              colour: BIT_PALETTES[palette][role as PixelRole],
            },
          ],
    ),
  );
