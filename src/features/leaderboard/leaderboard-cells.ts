/**
 * Row and cell classes shared by the board and its skeleton: a skeleton row must have the height
 * and columns of a loaded row, so both read these strings.
 */
export const BOARD_ROW_CLASS = 'border-t border-line target:bg-accent-soft';
export const RANK_CELL_CLASS = 'px-2 py-2.5 text-right align-middle font-mono tabular-nums';
/** `max-w-0 w-full` lets the auto-layout user column take the rest of the width and shrink (its name truncates) instead of pushing the table wider. */
export const USER_CELL_CLASS = 'w-full max-w-0 px-2 py-2.5 align-middle';
export const ORGANIZATION_CELL_CLASS =
  'hidden max-w-32 truncate px-2 py-2.5 align-middle text-muted lg:table-cell';

/** Below lg only the sorted number shows (a select sorts there); from lg up all five do. */
const NARROW_HIDDEN = 'hidden lg:table-cell';

/** The sorted number is bold and coloured; the other numbers are plain. */
export const valueCellClass = (isActive: boolean) =>
  `${RANK_CELL_CLASS} ${isActive ? 'font-bold text-positive' : NARROW_HIDDEN}`.trimEnd();

/** The avatar's size in px. The skeleton's `size-7` is the same 28 px (Tailwind classes cannot be computed). */
export const AVATAR_PX = 28 as const;

/** Auto layout: each number column is as wide as its heading and figures, the user column takes the rest and truncates, so the table fits its card at every width. */
export const BOARD_TABLE_CLASS = 'w-full table-auto text-sm';

/** One viewport's worth of skeleton rows; a full page of them would be thousands of px tall. */
export const SKELETON_ROW_COUNT = 12;

/** The header row and its cells, shared by the board and its skeleton. */
export const BOARD_HEAD_CLASS =
  'text-left text-caption font-semibold tracking-wide text-muted uppercase';
export const RANK_HEAD_CLASS = 'w-12 px-2 py-2 text-right align-middle';
export const USER_HEAD_CLASS = 'px-2 py-2 align-middle';
export const ORGANIZATION_HEAD_CLASS =
  'hidden px-2 py-2 align-middle whitespace-nowrap lg:table-cell';
const VALUE_HEAD_BASE = 'text-right align-middle whitespace-nowrap';

/** The sorted number's heading is in full colour. */
export const valueHeadClass = (isActive: boolean) =>
  `${VALUE_HEAD_BASE} ${isActive ? 'text-content' : NARROW_HIDDEN}`;
/** What sits inside a number heading, as the sort button and as the skeleton's stand-in: one 44 px tall line. */
export const VALUE_HEAD_INNER_CLASS = 'flex min-h-11 w-full items-center justify-end gap-1 px-1';
