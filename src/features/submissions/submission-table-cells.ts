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

/** What one `ColumnKey` draws: the verdict column also holds the score, the cost column time and memory. */
export type CellKind =
  'verdict' | 'score' | 'problem' | 'user' | 'time' | 'memory' | 'language' | 'when';
export const CELLS_OF: Record<ColumnKey, readonly CellKind[]> = {
  verdict: ['verdict', 'score'],
  problem: ['problem'],
  user: ['user'],
  cost: ['time', 'memory'],
  language: ['language'],
  when: ['when'],
};
export const cellsOf = (keys: readonly ColumnKey[]) => keys.flatMap((key) => CELLS_OF[key]);

/**
 * The full table is one 36 px line per submission, `table-fixed`, and shows cells by the width of its card (a container
 * query, so the filter rail beside it does not matter): verdict chip, score, problem, user and source always; "when" from
 * @2xl (42rem), time from @3xl (48rem), memory from @4xl (56rem), language from @5xl (64rem). A card narrower than the base
 * minimum (`COMPACT_BELOW_PX`: a phone, a tablet beside the filter rail) shows the two-line rows of
 * `SubmissionCompactList.vue` instead, so the list never scrolls sideways.
 */
export const FULL_TABLE_CLASS =
  'table-fixed min-w-[36rem] @2xl:min-w-[40rem] @3xl:min-w-[45rem] @4xl:min-w-[51rem] @5xl:min-w-[58rem] [&_td]:truncate';

/** The base minimum width of the full table (`min-w-[36rem]` above) in px. */
export const COMPACT_BELOW_PX = 584;

/** The width of the card that holds the full table: the container the cell tiers above are measured against. */
export const TABLE_CARD_CLASS = '@container overflow-hidden';

/** Cell widths of the full table; the problem cell takes the rest. Shared with the skeleton. */
export const CELL_WIDTH_CLASS: Record<CellKind | 'pick' | 'source', string> = {
  pick: 'w-14',
  verdict: 'w-20',
  score: 'w-32',
  problem: '',
  user: 'w-32',
  time: 'w-20',
  memory: 'w-24',
  language: 'w-28',
  when: 'w-16',
  source: 'w-14',
};

/** The cells that give way as the card narrows (see `FULL_TABLE_CLASS`). */
export const CELL_TIER_CLASS: Partial<Record<CellKind, string>> = {
  when: 'hidden @2xl:table-cell',
  time: 'hidden @3xl:table-cell',
  memory: 'hidden @4xl:table-cell',
  language: 'hidden @5xl:table-cell',
};

/** Width and tier of a cell of the full table. */
export const fullCellClass = (kind: CellKind | 'pick' | 'source') =>
  `${CELL_WIDTH_CLASS[kind]} ${CELL_TIER_CLASS[kind as CellKind] ?? ''}`;

/** Numbers line up on the right. */
export const NUMBER_CELLS: ReadonlySet<CellKind> = new Set(['score', 'time', 'memory']);

/** Shared by `SubmissionTable.vue` and its skeleton, so the two cannot drift apart in height or width. */
export const HEADER_CELL_CLASSES =
  'h-8 px-2 text-tiny font-semibold whitespace-nowrap first:pl-4 last:pr-3';
export const BODY_CELL_CLASSES =
  'h-(--qh-row) px-2 align-middle text-meta first:pl-4 last:pr-3 touch:h-12';
/** The header row: a tinted band above the first row. */
export const HEADER_ROW_CLASSES = 'bg-surface-strong text-left text-muted';
