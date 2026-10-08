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
