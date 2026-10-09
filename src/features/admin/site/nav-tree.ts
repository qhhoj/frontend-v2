import type { NavigationItem } from '@/api/types/site-admin';

export interface NavRow {
  item: NavigationItem;
  depth: number;
  regexError: string | null;
}

/** The engine's message for a regex that does not compile; `''` is a valid "no regex". */
export function regexProblem(source: string): string | null {
  if (source === '') return null;
  try {
    new RegExp(source);
    return null;
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
}

/** Mirrors the backend's `isSafeNavigationPath`: a site path (never `//host` or `/\\`) or an http(s) URL, no spaces. */
export const isSafePath = (path: string) => /^(\/(?![/\\])|https?:\/\/)\S*$/.test(path);

export const hasChildren = (items: NavigationItem[], id: string) =>
  items.some((item) => item.parentId === id);

const byOrder = (left: NavigationItem, right: NavigationItem) =>
  left.order - right.order || left.key.localeCompare(right.key);

/** Walks up from `item`: true when the walk reaches the top without a loop or a missing parent. */
function reachesTop(byId: Map<string, NavigationItem>, item: NavigationItem): boolean {
  const seen = new Set<string>();
  let current = item;
  while (current.parentId !== null) {
    if (seen.has(current.id) || !byId.has(current.parentId)) return false;
    seen.add(current.id);
    current = byId.get(current.parentId)!;
  }
  return true;
}

/** Parents first by order, their children indented right under them. An orphan or a cycle shows at the top, as the site does. */
export function navRows(items: NavigationItem[]): NavRow[] {
  const byId = new Map(items.map((item) => [item.id, item]));
  const isTop = (item: NavigationItem) => item.parentId === null || !reachesTop(byId, item);
  const childrenOf = (id: string) =>
    items.filter((item) => item.parentId === id && !isTop(item)).sort(byOrder);
  const rows: NavRow[] = [];
  const visit = (item: NavigationItem, depth: number) => {
    rows.push({ item, depth, regexError: regexProblem(item.regex) });
    for (const child of childrenOf(item.id)) visit(child, depth + 1);
  };
  for (const item of items.filter(isTop).sort(byOrder)) visit(item, 0);
  return rows;
}

/** Every entry below `id`, at any depth. */
export function descendantsOf(items: NavigationItem[], id: string): Set<string> {
  const found = new Set<string>();
  const queue = [id];
  while (queue.length > 0) {
    const parentId = queue.shift()!;
    for (const child of items.filter((item) => item.parentId === parentId)) {
      if (found.has(child.id)) continue;
      found.add(child.id);
      queue.push(child.id);
    }
  }
  return found;
}

/** The entries an item may be moved under: everything but itself and its descendants. */
export function parentChoices(items: NavigationItem[], editingId: string | null): NavigationItem[] {
  if (editingId === null) return [...items].sort(byOrder);
  const excluded = descendantsOf(items, editingId).add(editingId);
  return items.filter((item) => !excluded.has(item.id)).sort(byOrder);
}
