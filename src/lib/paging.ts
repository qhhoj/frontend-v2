import type { NumberedPageMeta } from '@/api/client';

export type PageSlot = number | 'gap';
const MAX_PAGE = 10_000;

/** First, last, and the current page with its neighbours; a gap of exactly one page is written out. */
export function pageWindow(current: number, last: number): PageSlot[] {
  const wanted = [1, current - 1, current, current + 1, last].filter(
    (page) => page >= 1 && page <= last,
  );
  const pages = [...new Set(wanted)].sort((left, right) => left - right);
  return pages.flatMap((page, index): PageSlot[] => {
    const previous = pages[index - 1];
    if (previous === undefined || page - previous === 1) return [page];
    return page - previous === 2 ? [page - 1, page] : ['gap', page];
  });
}

/** The last page: from the total, or one past the current page while `hasMore` (lists without a total). */
export const lastPageOf = (meta: NumberedPageMeta): number =>
  'total' in meta
    ? Math.max(1, Math.ceil(meta.total / meta.pageSize))
    : meta.page + (meta.hasMore ? 1 : 0);

/** `?page=` as the API accepts it (1..10000), else 1. */
export function pageFromQuery(value: unknown): number {
  const page = Number(Array.isArray(value) ? value[0] : value);
  return Number.isInteger(page) && page >= 1 && page <= MAX_PAGE ? page : 1;
}

/**
 * Where to send a reader whose page holds no rows although earlier pages exist (an old or edited `?page=`): the last page
 * when the total is known, else the first. Null when the page is the first or has rows.
 */
export function fallbackPageOf(meta: NumberedPageMeta, rowCount: number): number | null {
  if (rowCount > 0 || meta.page <= 1) return null;
  return 'total' in meta ? Math.min(meta.page - 1, lastPageOf(meta)) : 1;
}

/** `query` with the page key set to `page` (dropped for page 1), every other key kept. */
export function queryWithPage<Value>(
  query: Record<string, Value>,
  queryKey: string,
  page: number,
): Record<string, Value | string> {
  const kept = Object.fromEntries(Object.entries(query).filter(([key]) => key !== queryKey));
  return page === 1 ? kept : { ...kept, [queryKey]: String(page) };
}
