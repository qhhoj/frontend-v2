import { describe, expect, it } from 'vitest';
import { polygonPackage, polygonProblem } from '@/test/admin-fixtures/polygon';
import { previewCautionsOf } from './polygon-preview';

const problem = (revision: number, packageRevision: number, modified = false, type = 'full') =>
  polygonProblem({
    revision,
    modified,
    latestPackage: polygonPackage({ revision: packageRevision, type: type as 'full' }),
  });

describe('previewCautionsOf', () => {
  it('has nothing to say about a current full package', () => {
    expect(previewCautionsOf(problem(10, 10))).toEqual([]);
  });

  it('flags a package older than the committed revision', () => {
    expect(previewCautionsOf(problem(10, 9))).toEqual([
      { kind: 'stale', packageRevision: 9, revision: 10, modified: false },
    ]);
    expect(previewCautionsOf(problem(10, 9, true))).toEqual([
      { kind: 'stale', packageRevision: 9, revision: 10, modified: true },
    ]);
  });

  it('flags uncommitted changes on a current package', () => {
    expect(previewCautionsOf(problem(10, 10, true))).toEqual([
      { kind: 'modified', packageRevision: 10 },
    ]);
  });

  it('adds the standard package cost after the freshness caution', () => {
    expect(previewCautionsOf(problem(10, 10, false, 'standard'))).toEqual([{ kind: 'standard' }]);
    expect(
      previewCautionsOf(problem(10, 9, false, 'standard')).map((caution) => caution.kind),
    ).toEqual(['stale', 'standard']);
  });
});
