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
});
