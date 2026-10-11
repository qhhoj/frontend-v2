import { describe, expect, it, vi } from 'vitest';
import { mockApi, ok } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { staffViewer } from '@/test/admin-routes';
import { similarityPairDetail } from '@/test/admin-fixtures/similarity';

/** AdminShell and the screens load lazily: wait until the screen's own content is in the DOM. */
const mountScreen = async (
  path: string,
  isReady: (wrapper: Awaited<ReturnType<typeof mountApp>>['wrapper']) => boolean,
) => {
  const mounted = await mountApp(path);
  await vi.waitFor(() => {
    if (!isReady(mounted.wrapper)) throw new Error('screen not yet');
  });
  return mounted;
};

describe('SimilarityPairPage', () => {
  it('keeps a deleted side readable: name kept, blanks for date, result, points and an empty pane', async () => {
    const detail = similarityPairDetail();
    detail.right = { ...detail.right, date: null, result: null, points: null, source: '' };
    mockApi({ ...staffViewer(['judge.moss_contest']), 'GET /similarity/pairs/pair-1': ok(detail) });
    const { wrapper } = await mountScreen('/admin/similarity/pairs/pair-1', (view) =>
      view.find('[data-testid="pane-right"]').exists(),
    );
    expect(wrapper.get('[data-testid="pane-right"]').text()).toContain('bao_ly');
    expect(wrapper.get('[data-testid="pane-right"]').text()).toContain('Bài nộp đã bị xóa');
  });
});
