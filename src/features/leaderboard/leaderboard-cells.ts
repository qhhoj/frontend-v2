/**
 * Row and cell classes shared by the board and its skeleton: a skeleton row must have the height
 * and columns of a loaded row, so both read these strings.
 */
export const BOARD_ROW_CLASS = 'border-t border-line target:bg-accent-soft';
export const RANK_CELL_CLASS = 'px-3 py-2.5 text-right font-mono tabular-nums';
export const USER_CELL_CLASS = 'overflow-hidden px-3 py-2.5';
export const ORGANIZATION_CELL_CLASS = 'hidden truncate px-3 py-2.5 text-muted md:table-cell';

/** The active number is always shown; the other numbers show from xl up, where the card has room for them. */
export const valueCellClass = (isActive: boolean) =>
  `${RANK_CELL_CLASS} ${isActive ? 'font-bold text-positive' : 'hidden xl:table-cell'}`;

/** The avatar's size in px. The skeleton's `size-7` is the same 28 px (Tailwind classes cannot be computed). */
export const AVATAR_PX = 28 as const;

/**
 * The table never squeezes the user column: from md up it is at least 12rem wide beside the rank, organization and
 * active number (29.5rem), and from xl beside all four numbers (50.5rem). A card narrower than that scrolls sideways.
 */
export const BOARD_TABLE_CLASS = 'w-full table-fixed text-sm md:min-w-[29.5rem] xl:min-w-[50.5rem]';

/** One viewport's worth of skeleton rows; a full page of them would be thousands of px tall. */
export const SKELETON_ROW_COUNT = 12;

/** The header row and its cells, shared by the board and its skeleton. */
export const BOARD_HEAD_CLASS =
  'text-left text-[12px] font-semibold tracking-wide text-muted uppercase';
/** The table is `table-fixed`: the header cells' widths are the column widths, so a sort change or new rows never move a column. The user column takes the rest. */
export const RANK_HEAD_CLASS = 'w-14 px-3 py-2 text-right';
export const USER_HEAD_CLASS = 'px-3 py-2';
export const ORGANIZATION_HEAD_CLASS = 'hidden w-28 px-3 py-2 md:table-cell';
const VALUE_HEAD_BASE = 'w-28 px-3 py-2 text-right whitespace-nowrap';

/** The active number's heading is in full colour; the others show from xl up. */
export const valueHeadClass = (isActive: boolean) =>
  `${VALUE_HEAD_BASE} ${isActive ? 'text-content' : 'hidden xl:table-cell'}`;

/** The full-name line is always there (a non-breaking space when it repeats the username), so every row is as tall. */
export const NO_FULL_NAME = '\u00a0';
/**
 * The contributors board has one number, not four. Its spacer takes the other three columns' width (3 x 7rem) from xl up,
 * so rank, user and organization sit where they do on every other tab.
 */
export const SPACER_HEAD_CLASS = 'hidden w-[21rem] xl:table-cell';
export const SPACER_CELL_CLASS = 'hidden xl:table-cell';
