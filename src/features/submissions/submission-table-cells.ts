/** Columns a submission table can show, in table order. */
export type ColumnKey =
  'verdict' | 'problem' | 'user' | 'score' | 'time' | 'memory' | 'language' | 'when';

/** The full table needs this width to keep its eight columns readable; a narrowed one fits a phone without it. */
export const FULL_TABLE_MIN_WIDTH_CLASS = 'min-w-[1040px]';

/**
 * Column widths of the full table, which is `table-fixed` (a narrowed one stays auto-sized to fit a phone), so a column keeps its width whatever the rows hold and
 * the problem column takes the rest. Shared with the skeleton.
 */
export const COLUMN_WIDTH_CLASS: Record<ColumnKey | 'pick', string> = {
  pick: 'w-16',
  verdict: 'w-32',
  problem: '',
  user: 'w-40',
  score: 'w-20',
  time: 'w-20',
  memory: 'w-24',
  language: 'w-32',
  when: 'w-28',
};

/** Shared by `SubmissionTable.vue` and its skeleton, so the two cannot drift apart in height or width. */
export const HEADER_CELL_CLASSES = 'px-3 py-3.5 font-medium first:pl-6 last:pr-6';
export const BODY_CELL_CLASSES = 'px-3 py-[11px] break-words first:pl-6 last:pr-6';
