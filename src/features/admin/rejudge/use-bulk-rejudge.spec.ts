import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { mountComponent } from '@/test/mount';
import { useBulkRejudge } from './use-bulk-rejudge';
import { rejudgeSubmissions } from '@/api/submission-actions.api';

vi.mock('@/api/submission-actions.api', () => ({ rejudgeSubmissions: vi.fn() }));

const BODY = { problem: 'hcmus41c' };

/** Mounts a component that only runs the composable, so it has the query client it needs. */
function mountBulkRejudge() {
  let composable!: ReturnType<typeof useBulkRejudge>;
  mountComponent(
    defineComponent({
      setup() {
        composable = useBulkRejudge();
        return () => h('div');
      },
    }),
  );
  return composable;
}

describe('useBulkRejudge', () => {
  it('reports a failure that is not an ApiError as a line, and never throws out of the confirm', async () => {
    vi.mocked(rejudgeSubmissions).mockRejectedValueOnce(new TypeError('boom'));
    const bulk = mountBulkRejudge();
    await expect(bulk.rejudge(BODY)).resolves.toBeUndefined();
    expect(bulk.outcome.value).toEqual({ kind: 'refused', text: 'Đã có lỗi xảy ra. Hãy thử lại.' });
  });
});
