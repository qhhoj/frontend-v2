import { TABLE_HEAD_CELL, TABLE_ROW_HEIGHT, TABLE_VARIANT } from '@/components/ui/table-classes';
/** Columns a submission table can show, in table order. The verdict column holds the score; `cost` is time and memory. */
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
 * The full table is one 44 px line per submission. Every cell but the problem keeps its text on one line at its own
 * width, so a name or a time is never cut; the problem cell takes the width that is left and is the only one that
 * truncates. Cells give way by the width of the table's own frame (a container query): verdict, score, problem and
 * user always; "when" from @2xl (42rem), time from @3xl (48rem), memory from @4xl (56rem), language from @5xl (64rem).
 * A frame narrower than `COMPACT_BELOW_PX` (a phone) shows the rows of `SubmissionCompactList.vue` instead, so the
 * list never scrolls sideways.
 */
export const FULL_TABLE_CLASS = 'w-full border-collapse';

/** Below this frame width (px) the compact rows replace the table. */
export const COMPACT_BELOW_PX = 584;

/** The frame that holds the full table: the container the cell tiers above are measured against. */
export const TABLE_CARD_CLASS = '@container overflow-hidden';

/** How a cell holds its content; the problem cell takes the rest and truncates. Shared with the skeleton. */
export const CELL_WIDTH_CLASS: Record<CellKind | 'pick', string> = {
  pick: 'w-14',
  verdict: 'whitespace-nowrap',
  score: 'whitespace-nowrap',
  problem: 'w-full max-w-0',
  user: 'whitespace-nowrap',
  time: 'whitespace-nowrap',
  memory: 'whitespace-nowrap',
  language: 'whitespace-nowrap',
  when: 'whitespace-nowrap',
};

/** The cells that give way as the frame narrows (see `FULL_TABLE_CLASS`). */
export const CELL_TIER_CLASS: Partial<Record<CellKind, string>> = {
  when: 'hidden @2xl:table-cell',
  time: 'hidden @3xl:table-cell',
  memory: 'hidden @4xl:table-cell',
  language: 'hidden @5xl:table-cell',
};

/** Width and tier of a cell of the full table. */
export const fullCellClass = (kind: CellKind | 'pick') =>
  `${CELL_WIDTH_CLASS[kind]} ${CELL_TIER_CLASS[kind as CellKind] ?? ''}`;

/** Numbers line up on the right, and the time of submitting ends the row. */
export const NUMBER_CELLS: ReadonlySet<CellKind> = new Set(['score', 'time', 'memory', 'when']);

/**
 * `ledger` (the default): no frame, a hairline under every row, a stronger rule under the head (the list sits on the
 * page). `surface`: the list is inside a card of its own (the contest's best-submissions page), rows are told apart by
 * a hairline above. The classes are shared by `SubmissionTable.vue` and its skeleton, so the two cannot drift apart.
 */
export type TableVariant = keyof typeof TABLE_VARIANT;
const CELL_EDGE: Record<TableVariant, string> = {
  ledger: 'first:pl-3 last:pr-3',
  surface: TABLE_VARIANT.surface.edge,
};
export const headerCellClasses = (variant: TableVariant) =>
  `${TABLE_HEAD_CELL} px-3 ${CELL_EDGE[variant]}`;
export const bodyCellClasses = (variant: TableVariant) =>
  `${TABLE_ROW_HEIGHT} px-3 align-middle text-body ${CELL_EDGE[variant]}`;
/** The header row: the same tone as the rows, like every table; the ledger rules it off. */
export const headerRowClasses = (variant: TableVariant) =>
  variant === 'ledger'
    ? `text-left text-muted border-b ${TABLE_VARIANT.ledger.headRule}`
    : 'text-left text-muted';
/** The rule that tells rows apart: under each row in a ledger, above each one in a card. */
export const ROW_RULE: Record<TableVariant, string> = {
  ledger: 'border-b border-line',
  surface: 'border-t border-line',
};

/**
 * "You are here" on a row: a 3 px bar in the action colour on the left of the viewer's own rows. Every row keeps the
 * bar's width (clear on the others), so the lamps of all rows stay on one line. `table` puts it on the row's first
 * cell (a table row has no border of its own), `list` on the row itself.
 */
export const OWN_BAR = {
  table: {
    own: '[&>:first-child]:border-l-3 [&>:first-child]:border-l-accent',
    other: '[&>:first-child]:border-l-3 [&>:first-child]:border-l-transparent',
  },
  list: { own: 'border-l-3 border-l-accent', other: 'border-l-3 border-l-transparent' },
} as const;
