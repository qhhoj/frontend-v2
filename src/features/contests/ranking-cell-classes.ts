import type { CellKind } from '@/lib/ranking-cells';

/** The chip colours of a ranking cell, shared by the ranking and the contest's own-result chip. */
export const KIND_CLASSES: Record<CellKind, string> = {
  /** An empty cell draws no chip. */
  empty: '',
  'first-solve': 'bg-verdict-ac-bg text-verdict-ac',
  solved: 'bg-verdict-ac-bg text-verdict-ac',
  partial: 'bg-warning-bg text-content',
  failed: 'bg-verdict-wa-bg text-verdict-wa',
  pending: 'bg-verdict-pending-bg text-verdict-pending',
};

/**
 * One rule for every cell, table and phone list: full score green tint, partial amber tint, zero after a try red tint,
 * not tried empty, pending amber text. The first solve looks like any full score plus a small star in the cell's corner.
 * The glyph (`+`, `−`, `?`, the star) says the same without colour.
 */
export const TABLE_CELL_CLASSES: Record<CellKind, string> = {
  empty: '',
  'first-solve': 'bg-verdict-ac-bg text-content',
  solved: 'bg-verdict-ac-bg text-content',
  partial: 'bg-warning-bg text-content',
  failed: 'bg-verdict-wa-bg text-verdict-wa',
  pending: 'text-verdict-pending',
};
