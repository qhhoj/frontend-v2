/** Columns a submission table can show, in table order. */
export type ColumnKey =
  'verdict' | 'problem' | 'user' | 'score' | 'time' | 'memory' | 'language' | 'when';

/** The full table needs this width to keep its eight columns readable; a narrowed one fits a phone without it. */
export const FULL_TABLE_MIN_WIDTH_CLASS = 'min-w-[900px]';

/** Shared by `SubmissionTable.vue` and its skeleton, so the two cannot drift apart in height or width. */
export const HEADER_CELL_CLASSES = 'px-3 py-3.5 font-medium first:pl-6 last:pr-6';
export const BODY_CELL_CLASSES = 'px-3 py-[11px] first:pl-6 last:pr-6';
