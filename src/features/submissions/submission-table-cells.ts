/** Columns a submission table can show, in table order. The verdict column holds the score; `cost` is "time · memory". */
export type ColumnKey = 'verdict' | 'problem' | 'user' | 'cost' | 'language' | 'when';
/** Every column, in table order. */
export const ALL_COLUMN_KEYS: readonly ColumnKey[] = [
  'verdict',
  'problem',
  'user',
  'cost',
  'language',
  'when',
];

/** A column plus the two that have no heading text: the pick box and the source link. */
export type ColumnSlot = ColumnKey | 'pick' | 'source';

/**
 * The full table is `table-fixed` and shows columns by the width of its card (a container query, so the filter rail
 * beside it does not matter): verdict, problem, user and source always; "when" from @2xl (42rem), language from
 * @3xl (48rem), cost (time and memory) from @4xl (56rem). Its minimum width is the shown columns plus 10rem for the problem
 * name. A card narrower than the base minimum (`COMPACT_BELOW_PX`: a phone, a tablet beside the filter rail) shows
 * the stacked rows of `SubmissionCompactList.vue` instead, so the list never scrolls sideways.
 */
export const FULL_TABLE_CLASS =
  'table-fixed min-w-[36.5rem] @2xl:min-w-[40.5rem] @3xl:min-w-[46.5rem] @4xl:min-w-[56rem] [&_td]:break-words';

/** The base minimum width of the full table (`min-w-[36.5rem]` above) in px. */
export const COMPACT_BELOW_PX = 584;

/** The width of the card that holds the full table: the container the column tiers above are measured against. */
export const TABLE_CARD_CLASS = '@container overflow-hidden';

/** Column widths of the full table (a narrowed one stays auto-sized), so a column keeps its width whatever the rows hold; the problem column takes the rest. Shared with the skeleton. */
export const COLUMN_WIDTH_CLASS: Record<ColumnSlot, string> = {
  pick: 'w-20',
  verdict: 'w-40',
  problem: '',
  user: 'w-32',
  cost: 'w-38',
  language: 'w-24',
  when: 'w-16',
  source: 'w-14',
};

/** The columns that give way as the card narrows (see `FULL_TABLE_CLASS`). */
export const COLUMN_TIER_CLASS: Partial<Record<ColumnKey, string>> = {
  when: 'hidden @2xl:table-cell',
  language: 'hidden @3xl:table-cell',
  cost: 'hidden @4xl:table-cell',
};

/** Width and tier of a column of the full table; a narrowed table has neither. */
export const fullColumnClass = (key: ColumnSlot, isFull: boolean) =>
  isFull ? `${COLUMN_WIDTH_CLASS[key]} ${COLUMN_TIER_CLASS[key as ColumnKey] ?? ''}` : '';

/** Shared by `SubmissionTable.vue` and its skeleton, so the two cannot drift apart in height or width. */
export const HEADER_CELL_CLASSES = 'px-2 py-3.5 font-medium whitespace-nowrap first:pl-6 last:pr-4';
export const BODY_CELL_CLASSES = 'px-2 py-2 align-middle first:pl-6 last:pr-4';
/** The header row: a tinted band above the first row. */
export const HEADER_ROW_CLASSES = 'bg-surface-strong text-left text-meta text-muted';
