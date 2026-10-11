import { describe, expect, it } from 'vitest';
import { publishedProblem, publishResult } from '@/test/contest-extras-fixtures';
import { editorialKey, mayPublishAfter, outcomeKey, reasonKey } from './publish-outcomes';

const items = [
  publishedProblem({ problemId: 'a', outcome: 'published', editorial: 'published' }),
  publishedProblem({ problemId: 'b', outcome: 'unchanged', editorial: 'none' }),
  publishedProblem({ problemId: 'c', outcome: 'skipped', reason: 'no_permission' }),
  publishedProblem({ problemId: 'd', code: null, outcome: 'skipped', reason: 'not_found' }),
];

describe('publish outcomes', () => {
  it('names the outcome, the reason and the editorial result by key', () => {
    expect(outcomeKey(items[0]!)).toBe('admin.contestPublish.outcomes.published');
    expect(reasonKey(items[2]!)).toBe('admin.contestPublish.reasons.no_permission');
    expect(reasonKey(items[0]!)).toBeNull();
    expect(reasonKey(publishedProblem({ outcome: 'skipped', reason: 'deleted' }))).toBe(
      'admin.contestPublish.reasons.deleted',
    );
    expect(reasonKey(publishedProblem({ outcome: 'skipped', reason: 'brand_new' as never }))).toBe(
      'admin.contestPublish.reasons.other',
    );
    expect(editorialKey(items[1]!)).toBe('admin.contestPublish.editorials.none');
    expect(editorialKey(publishedProblem({ editorial: null }))).toBeNull();
  });

  it('offers the real run only after a dry run with the same editorial choice', () => {
    const dryRun = { editorials: true, result: publishResult(items, true) };
    expect(mayPublishAfter(null, true)).toBe(false);
    expect(mayPublishAfter(dryRun, true)).toBe(true);
    expect(mayPublishAfter(dryRun, false)).toBe(false);
  });
});
