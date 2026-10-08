/**
 * Row and cell classes shared by the board and its skeleton: a skeleton row must have the height
 * and columns of a loaded row, so both read these strings.
 */
export const BOARD_ROW_CLASS = 'border-t border-line target:bg-accent-soft';
export const RANK_CELL_CLASS = 'px-3 py-2.5 text-right font-mono tabular-nums';
export const USER_CELL_CLASS = 'px-3 py-2.5';
export const ORGANIZATION_CELL_CLASS = 'hidden px-3 py-2.5 text-muted md:table-cell';

/** The active number is always shown; the other numbers show from md up. */
export const valueCellClass = (isActive: boolean) =>
  `${RANK_CELL_CLASS} ${isActive ? 'font-semibold' : 'hidden md:table-cell'}`;

/** The avatar's size in px. The skeleton's `size-7` is the same 28 px (Tailwind classes cannot be computed). */
export const AVATAR_PX = 28 as const;
