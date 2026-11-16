/**
 * Height and head recipe shared by every table, including the ones built by hand (contest list, contest problems, submissions):
 * the head and each row are one `--qh-row` (44 px; the touch height on a coarse pointer), the head is 13 px semibold muted on the
 * same surface tone as the rows, and rows are told apart by a hairline only (Kit 2 spec §4).
 */
export const TABLE_ROW_HEIGHT = 'h-(--qh-row) touch:h-(--qh-touch)';
export const TABLE_HEAD_TEXT = 'text-small font-semibold whitespace-nowrap text-muted';
export const TABLE_HEAD_CELL = `${TABLE_ROW_HEIGHT} ${TABLE_HEAD_TEXT}`;
