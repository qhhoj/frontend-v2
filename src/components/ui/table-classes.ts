/**
 * Height and head recipe shared by every table, including the ones built by hand (contest list, contest problems, submissions):
 * the head and each row are one `--qh-row` (44 px; the touch height on a coarse pointer), the head is 13 px semibold muted on the
 * same surface tone as the rows, and rows are told apart by a hairline only (Kit 2 spec §4).
 */
export const TABLE_ROW_HEIGHT = 'h-(--qh-row) touch:h-(--qh-touch)';
export const TABLE_HEAD_TEXT = 'text-small font-semibold whitespace-nowrap text-muted';
export const TABLE_HEAD_CELL = `${TABLE_ROW_HEIGHT} ${TABLE_HEAD_TEXT}`;

/**
 * `DataTable variant="ledger"`: a list that is not a destination of its own sits on the page with no frame (layout A, "Rail and
 * ledger"). No fill, no radius, no padding at the ends; a hairline under every row, the last one too; a stronger rule under the head.
 * The sticky head and pinned columns take the page tone (`ground`) because no card stands behind them. `surface` is the card.
 */
export const TABLE_VARIANT = {
  ledger: {
    edge: 'first:pl-0 last:pr-0',
    headRule: 'border-line-strong',
    pinTone: 'bg-ground',
    stackedRow: 'px-0 hover:bg-surface-hover',
    bar: 'px-0',
    lastRowRule: '',
    footerRule: '',
  },
  surface: {
    edge: 'first:pl-(--qh-pad-surface) last:pr-(--qh-pad-surface)',
    headRule: 'border-line',
    pinTone: 'bg-surface-solid',
    stackedRow: 'px-4 last:border-b-0',
    bar: 'px-3',
    lastRowRule: '[&_tbody_tr:last-child_td]:border-b-0',
    footerRule: 'border-t border-line',
  },
} as const;
