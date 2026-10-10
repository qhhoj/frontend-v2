import type { PolygonProblem } from '@/api/types/polygon';

/** Why a card cannot be picked; the backend refuses the import for each of these. */
export type CardBlock = 'linked' | 'running' | 'failed' | 'noPackage';

const BLOCK_BY_STATE = {
  READY: null,
  RUNNING: 'running',
  FAILED: 'failed',
  NONE: 'noPackage',
} as const satisfies Record<PolygonProblem['latestPackage']['state'], CardBlock | null>;

/** A linked problem is synced from its editor, whatever its package; otherwise only a READY newest package imports. */
export const cardBlockOf = (problem: PolygonProblem): CardBlock | null =>
  problem.linkedProblemCode !== null ? 'linked' : BLOCK_BY_STATE[problem.latestPackage.state];

export const PICK_FILTERS = ['all', 'ready', 'running', 'unavailable'] as const;
export type PickFilter = (typeof PICK_FILTERS)[number];

const STATES_OF: Record<PickFilter, PolygonProblem['latestPackage']['state'][]> = {
  all: ['READY', 'RUNNING', 'FAILED', 'NONE'],
  ready: ['READY'],
  running: ['RUNNING'],
  unavailable: ['FAILED', 'NONE'],
};

const matchesSearch = (problem: PolygonProblem, search: string) => {
  const needle = search.trim().toLowerCase();
  if (!needle) return true;
  return [String(problem.id), problem.name, problem.title ?? '', problem.owner].some((text) =>
    text.toLowerCase().includes(needle),
  );
};

/** The cards for a search (id, name, title or owner, any case) and a package-state chip. */
export const filterProblems = (problems: PolygonProblem[], search: string, filter: PickFilter) =>
  problems.filter(
    (problem) =>
      STATES_OF[filter].includes(problem.latestPackage.state) && matchesSearch(problem, search),
  );

/** How many cards each chip would show for the current search. */
export const filterCounts = (problems: PolygonProblem[], search: string) =>
  Object.fromEntries(
    PICK_FILTERS.map((filter) => [filter, filterProblems(problems, search, filter).length]),
  ) as Record<PickFilter, number>;
