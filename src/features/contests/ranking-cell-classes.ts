import type { CellKind } from '@/lib/ranking-cells';

/** The chip colours of a ranking cell, shared by the ranking and the contest's own-result chip. */
export const KIND_CLASSES: Record<CellKind, string> = {
  /** An empty cell draws no chip. */
  empty: '',
  'first-solve': 'bg-first-solve text-first-solve-text',
  solved: 'bg-verdict-ac-bg text-verdict-ac',
  partial: 'text-verdict-partial',
  failed: 'bg-verdict-wa-bg text-verdict-wa',
  pending: 'bg-verdict-pending-bg text-verdict-pending',
};

export const PARTIAL_CLASSES = {
  1: 'bg-partial-bg-1',
  2: 'bg-partial-bg-2',
  3: 'bg-partial-bg-3',
} as const;

/**
 * The ranking table's cells: the score is plain ink and only meaning is coloured. A full score has a light success
 * tint, the first solve a strong fill (with its star), a partial score stays plain, a failed try is red text and a
 * pending one amber text, with no fill. The glyph (`+`, `−`, `?`, the star) says the same without colour.
 */
export const TABLE_CELL_CLASSES: Record<CellKind, string> = {
  empty: '',
  'first-solve': 'bg-first-solve text-first-solve-text',
  solved: 'bg-verdict-ac-bg text-content',
  partial: 'text-content',
  failed: 'text-verdict-wa',
  pending: 'text-verdict-pending',
};

/** The time line under a table cell's score: muted, except on the first solve's fill where it keeps the fill's text colour. */
export const TABLE_CELL_TIME_CLASSES: Record<CellKind, string> = {
  empty: '',
  'first-solve': 'opacity-80',
  solved: 'text-muted',
  partial: 'text-muted',
  failed: 'text-muted',
  pending: 'text-muted',
};
