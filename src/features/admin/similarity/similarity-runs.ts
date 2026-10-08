import type { LocationQuery, LocationQueryValue } from 'vue-router';
import { ApiError } from '@/api/client';
import type {
  SimilarityGroup,
  SimilarityRun,
  SimilarityScope,
  SimilarityScopeKind,
} from '@/api/types/similarity';

const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;
const SECONDS_PER_HOUR = SECONDS_PER_MINUTE * MINUTES_PER_HOUR;

/** A query value as one non-empty string; a repeated or blank key is no value. */
const singleValue = (value: LocationQuery[string] | undefined): LocationQueryValue | null => {
  const text = typeof value === 'string' ? value.trim() : '';
  return text === '' ? null : text;
};

/** The scope named by the URL: exactly one of `contest` or `problem`. */
export function scopeFromQuery(query: LocationQuery): SimilarityScope | null {
  const contest = singleValue(query.contest);
  const problem = singleValue(query.problem);
  if (contest && !problem) return { contest };
  if (problem && !contest) return { problem };
  return null;
}

export const scopeQuery = (scope: SimilarityScope): Record<string, string> => ({ ...scope });

export const scopeKindOf = (scope: SimilarityScope): SimilarityScopeKind =>
  'problem' in scope ? 'problem' : 'contest';
/** The code or key the scope names, whichever kind it is. */
export const scopeValueOf = (scope: SimilarityScope): string =>
  'problem' in scope ? scope.problem : scope.contest;

/** The `run` parameter of the URL: the summary shown under the list. */
export const runIdFromQuery = (query: LocationQuery): string | null => singleValue(query.run);

const secondsBetween = (from: string, to: string) =>
  Math.round((new Date(to).getTime() - new Date(from).getTime()) / 1000);

export const runDurationSeconds = (run: SimilarityRun): number | null =>
  run.startedAt && run.finishedAt ? secondsBetween(run.startedAt, run.finishedAt) : null;

/** Pairs are counted only once a run is done: a running run's groups are still filling. */
export const totalPairs = (run: SimilarityRun): number | null =>
  run.status === 'done' ? run.groups.reduce((sum, group) => sum + group.pairCount, 0) : null;

export const isActive = (run: SimilarityRun): boolean =>
  run.status === 'queued' || run.status === 'running';

export const activeRunOf = (runs: SimilarityRun[]): SimilarityRun | null =>
  runs.find(isActive) ?? null;

export const truncatedGroups = (run: SimilarityRun): SimilarityGroup[] =>
  run.groups.filter((group) => group.truncated);

export const isNotFound = (error: unknown): boolean =>
  error instanceof ApiError && error.status === 404;

export type WaitUnit = 'seconds' | 'minutes' | 'hours';

/** A `Retry-After` in the largest unit that reads as a whole number, rounded up: 2520 s is 42 minutes, 5400 s is 2 hours. */
export function waitParts(seconds: number): { unit: WaitUnit; count: number } {
  if (seconds < SECONDS_PER_MINUTE) return { unit: 'seconds', count: seconds };
  const minutes = Math.ceil(seconds / SECONDS_PER_MINUTE);
  if (minutes < MINUTES_PER_HOUR) return { unit: 'minutes', count: minutes };
  return { unit: 'hours', count: Math.ceil(seconds / SECONDS_PER_HOUR) };
}
