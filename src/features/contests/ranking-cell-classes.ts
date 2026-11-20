import type { CellKind } from '@/lib/ranking-cells';

/**
 * One rule for every cell of the board: full score green tint, partial lime text with no tint, zero after a try red
 * tint, not tried a dash, pending (withheld by the freeze) amber text. The first solve looks like any full score plus a
 * gold star in the cell's corner. The glyph (`+`, `−`, `?`, the star, the dash) says the same without colour.
 */
export const TABLE_CELL_CLASSES: Record<CellKind, string> = {
  empty: 'text-muted',
  'first-solve': 'bg-verdict-ac-bg text-verdict-ac',
  solved: 'bg-verdict-ac-bg text-verdict-ac',
  partial: 'text-verdict-partial',
  failed: 'bg-verdict-wa-bg text-verdict-wa',
  pending: 'text-verdict-pending',
};

/** The viewer's state on a problem, as the contest strip draws its letter: filled = solved, a bar under it = tried. */
export type LetterState = 'solved' | 'partial' | 'failed' | 'pending' | 'none';
export const LETTER_STATE_OF: Record<CellKind, LetterState> = {
  empty: 'none',
  'first-solve': 'solved',
  solved: 'solved',
  partial: 'partial',
  failed: 'failed',
  pending: 'pending',
};
const LETTER_BAR = 'after:absolute after:inset-x-1 after:bottom-1 after:h-0.5 after:rounded-pill';
export const LETTER_CLASSES: Record<LetterState, string> = {
  solved: 'border-transparent bg-verdict-ac-solid text-verdict-ac-on',
  partial: `border-line ${LETTER_BAR} after:bg-verdict-part-solid`,
  failed: `border-line ${LETTER_BAR} after:bg-verdict-wa-solid`,
  pending: `border-line ${LETTER_BAR} after:bg-verdict-pending-solid`,
  none: 'border-line',
};
