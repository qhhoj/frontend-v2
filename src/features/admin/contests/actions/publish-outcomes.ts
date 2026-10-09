import type { PublishedProblem, PublishProblemsResult } from '@/api/types/contest-ops';

export interface PublishSummary {
  published: number;
  unchanged: number;
  skipped: number;
}
/** The dry run the card showed and the editorial choice it was run with. */
export interface DryRunChoice {
  editorials: boolean;
  result: PublishProblemsResult;
}

const PREFIX = 'admin.contestPublish';
/** The skip reasons this screen names; a newer backend reason reads "other". */
const KNOWN_REASONS: readonly string[] = [
  'no_permission',
  'organization_private',
  'not_found',
  'deleted',
];

export function publishSummary(items: readonly PublishedProblem[]): PublishSummary {
  const summary: PublishSummary = { published: 0, unchanged: 0, skipped: 0 };
  for (const item of items) summary[item.outcome] += 1;
  return summary;
}

export const outcomeKey = (item: PublishedProblem) => `${PREFIX}.outcomes.${item.outcome}`;

export function reasonKey(item: PublishedProblem): string | null {
  if (item.reason === null) return null;
  return `${PREFIX}.reasons.${KNOWN_REASONS.includes(item.reason) ? item.reason : 'other'}`;
}

export const editorialKey = (item: PublishedProblem): string | null =>
  item.editorial === null ? null : `${PREFIX}.editorials.${item.editorial}`;

/** Publishing has no undo: the real run follows a dry run made with the same editorial choice. */
export const mayPublishAfter = (dryRun: DryRunChoice | null, editorials: boolean): boolean =>
  dryRun !== null && dryRun.editorials === editorials;

/** The reasons a failed automatic run records; a newer one reads "other". */
const AUTO_REASONS: readonly string[] = [
  'actor_unavailable',
  'no_permission',
  'cannot_edit_contest',
];
export const autoReasonKey = (reason: string): string =>
  `${PREFIX}.auto.reasons.${AUTO_REASONS.includes(reason) ? reason : 'other'}`;
