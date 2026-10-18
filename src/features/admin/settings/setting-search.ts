import { matchesText } from '../shell/search/admin-search';

/** One row a settings search can show, with every text that names it (key, label, hint, its block's title and help). */
export interface SearchableRow {
  key: string;
  texts: readonly string[];
}

/**
 * The rows a settings search shows: those where any text holds the term (the Ctrl+K palette's case-insensitive match).
 * A blank term is no search, so the page shows its tabs again (`null`).
 */
export function settingSearchHits(
  term: string,
  rows: readonly SearchableRow[],
): ReadonlySet<string> | null {
  const trimmed = term.trim();
  if (!trimmed) return null;
  return new Set(
    rows
      .filter(({ texts }) => texts.some((text) => matchesText(text, trimmed)))
      .map(({ key }) => key),
  );
}
