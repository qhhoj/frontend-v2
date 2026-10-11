/**
 * Column definitions for `AdminDataTable`. On a phone the table becomes one card per row:
 * `primary` heads the card, `badge` columns sit beside it, `secondary` ones form a "Label value · Label value" line, and
 * `meta` ones go into a "Chi tiết" disclosure.
 */
export type ColumnPriority = 'primary' | 'badge' | 'secondary' | 'meta';

/** The `?sort=` values a column switches between; `first` is the direction of the first click (text asc, numbers/dates desc). */
export interface ColumnSort {
  asc: string;
  desc: string;
  first?: 'asc' | 'desc';
}

export interface AdminColumn {
  key: string;
  label: string;
  priority?: ColumnPriority;
  /** `end`: numbers, right-aligned in mono with tabular figures. */
  align?: 'start' | 'end';
  sort?: ColumnSort;
  /** The header text is for screen readers only (an actions or icon column). */
  hideLabel?: boolean;
  /** Takes the width the other columns leave (content wraps, or clips with `truncate`); one per table. Default: the primary column. */
  grow?: boolean;
  /** Extra classes on this column's cells (a width, `max-w-48 truncate`). */
  cellClass?: string;
}

/** The sort value after a header click: the first direction, then flipping. */
export function nextSort(sort: ColumnSort, current: string | undefined): string {
  if (current === sort.desc) return sort.asc;
  if (current === sort.asc) return sort.desc;
  return (sort.first ?? 'asc') === 'asc' ? sort.asc : sort.desc;
}

export function ariaSortOf(
  sort: ColumnSort | undefined,
  current: string | undefined,
): 'ascending' | 'descending' | undefined {
  if (!sort) return undefined;
  if (current === sort.asc) return 'ascending';
  if (current === sort.desc) return 'descending';
  return undefined;
}

/** The "1–50 / 312" range of a numbered page. */
export function rangeOf(page: number, pageSize: number, shown: number, total: number) {
  const from = shown === 0 ? 0 : (page - 1) * pageSize + 1;
  return { from, to: from === 0 ? 0 : from + shown - 1, total };
}
