import type { PolygonProblem } from '@/api/types/polygon';

/**
 * What the setter should know about the package an import takes (`latestPackage`, the newest READY one):
 * - `stale`: Polygon has commits newer than the package (`modified` adds that the working copy has more);
 * - `modified`: the package is current, but the working copy has uncommitted changes;
 * - `standard`: its tests are generated on a judge during the import, which is slower and needs a judge.
 */
export type PreviewCaution =
  | { kind: 'stale'; packageRevision: number; revision: number; modified: boolean }
  | { kind: 'modified'; packageRevision: number }
  | { kind: 'standard' };

/** The revision the import takes: the package's, else the problem's (a package always has one; the fallback is defensive). */
export const packageRevisionOf = (problem: PolygonProblem) =>
  problem.latestPackage.revision ?? problem.revision;

function freshnessOf(problem: PolygonProblem): PreviewCaution | null {
  const packageRevision = packageRevisionOf(problem);
  if (problem.revision > packageRevision)
    return {
      kind: 'stale',
      packageRevision,
      revision: problem.revision,
      modified: problem.modified,
    };
  return problem.modified ? { kind: 'modified', packageRevision } : null;
}

/** The cautions to show under the preview, freshness first. */
export function previewCautionsOf(problem: PolygonProblem): PreviewCaution[] {
  const freshness = freshnessOf(problem);
  const standard: PreviewCaution | null =
    problem.latestPackage.type === 'standard' ? { kind: 'standard' } : null;
  return [freshness, standard].filter((caution) => caution !== null);
}
