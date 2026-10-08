import { describe, expect, it, vi } from 'vitest';
import { fail, mockApi, ok } from '@/test/mock-api';
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
  it('shows both sources with the shared lines marked by fragment number', async () => {
    mockApi({
      ...staffViewer(['judge.moss_contest']),
      'GET /similarity/pairs/pair-1': ok(similarityPairDetail()),
    });
    const { wrapper } = await mountScreen('/admin/similarity/pairs/pair-1', (view) =>
      view.find('[data-testid="pane-left"]').exists(),
    );
    expect(wrapper.find('h1').text()).toBe('ngocanh ↔ bao_ly');
    const marked = wrapper.findAll('[data-testid="pane-left"] [data-fragment="0"]');
    expect(marked).toHaveLength(3);
    expect(wrapper.text()).toContain('trái 4–6');
  });

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

  it('shows a bare not-found for a hidden pair', async () => {
    mockApi({
      ...staffViewer(['judge.moss_contest']),
      'GET /similarity/pairs/pair-1': fail(404, 'not_found'),
    });
    const { wrapper } = await mountScreen('/admin/similarity/pairs/pair-1', (view) =>
      view.text().includes('Không tìm thấy'),
    );
    expect(wrapper.text()).toContain('Không tìm thấy');
  });
});
