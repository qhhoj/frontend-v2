import { describe, expect, it } from 'vitest';
import { createMemoryHistory } from 'vue-router';
import { createAppRouter } from '@/router';

describe('submission diff route', () => {
  it('resolves /submissions/diff to its own page, not to a submission with id "diff"', () => {
    const router = createAppRouter(createMemoryHistory());
    const resolved = router.resolve('/submissions/diff?left=a&right=b');
    expect(resolved.name).toBe('submission-diff');
    expect(resolved.meta.requiresAuth).toBe(true);
    expect(resolved.query).toEqual({ left: 'a', right: 'b' });
  });

  it('still resolves a real submission id to the submission page', () => {
    const router = createAppRouter(createMemoryHistory());
    expect(router.resolve('/submissions/0192a000-0000-7000-8000-000000000001').name).toBe(
      'submission',
    );
  });
});
