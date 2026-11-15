import { isProblemSort } from '@/api/types/problems';
import { START_LOCATION } from 'vue-router';
import type { LocationQuery, LocationQueryRaw, NavigationGuard } from 'vue-router';
import { readStorage, writeStorage } from '@/lib/storage';
import { useSessionStore } from '@/stores/session.store';
import { NO_FILTERS, toProblemQuery } from './use-problem-filters';
import type { ProblemFilters, SolvedFilter } from './use-problem-filters';

/**
 * A signed-in learner's own list setup: the solved choice and the sort. It is kept per browser and per account, saved
 * when the learner changes either one, and applied when the list is opened with a bare `/problems` (the rail link).
 */
export type ListSetup = Pick<ProblemFilters, 'solved' | 'sort'>;

const KEY = 'qhhoj.problems.setup';
const SOLVED_CHOICES: readonly SolvedFilter[] = ['any', 'unsolved', 'solved'];

/** The saved setup of this account; anything else (another account, an old or broken value) is no setup. */
export function parseListSetup(text: string | null, username: string): ListSetup | null {
  try {
    const saved: unknown = JSON.parse(text ?? 'null');
    if (typeof saved !== 'object' || saved === null) return null;
    const { user, solved, sort } = saved as Record<string, unknown>;
    if (user !== username || !SOLVED_CHOICES.includes(solved as SolvedFilter)) return null;
    if (sort !== null && !isProblemSort(sort)) return null;
    return { solved: solved as SolvedFilter, sort };
  } catch {
    return null;
  }
}

/** The query to open instead of a bare list, or null: the URL already says what to show, or nothing differs from the default. */
export function restoredQuery(
  query: LocationQuery,
  setup: ListSetup | null,
): LocationQueryRaw | null {
  if (Object.keys(query).length > 0 || setup === null) return null;
  if (setup.solved === 'any' && setup.sort === null) return null;
  return toProblemQuery({ ...NO_FILTERS, ...setup });
}

export const readListSetup = (username: string) => parseListSetup(readStorage(KEY), username);

export const saveListSetup = (username: string, setup: ListSetup) =>
  writeStorage(KEY, JSON.stringify({ user: username, solved: setup.solved, sort: setup.sort }));

/**
 * Back or Forward: the browser is already on the target entry (vue-router keeps its path in `history.state.current`),
 * while a push has not moved yet. The first load is excluded: there the entry is the target too, and it is a fresh visit.
 */
export const isHistoryMove = (isFirstLoad: boolean, stateCurrent: unknown, target: string) =>
  !isFirstLoad && stateCurrent === target;

/**
 * The list route's `beforeEnter`: entering a bare `/problems` (the rail link, a bookmark, the first load) opens it with the
 * signed-in viewer's setup, as a redirect, so the bare list is never fetched. Back or Forward onto a bare entry keeps it
 * bare: a redirect there would push a new entry and drop the forward history. Moves inside the list (Back, "Xóa tất cả")
 * never re-enter the route, so they never bring the setup back.
 */
export const restoreListSetup: NavigationGuard = (to, from) => {
  const username = useSessionStore().user?.username;
  const state: unknown = typeof history === 'undefined' ? null : history.state;
  const current =
    state && typeof state === 'object' ? (state as { current?: unknown }).current : null;
  if (!username || isHistoryMove(from === START_LOCATION, current, to.fullPath)) return true;
  const query = restoredQuery(to.query, readListSetup(username));
  return query ? { ...to, query } : true;
};
