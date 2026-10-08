import { flushPromises } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { mockApi, ok, page } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { staffViewer } from '@/test/admin-routes';
import { similarityPair, similarityRun } from '@/test/admin-fixtures/similarity';

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

describe('SimilarityPairsPage', () => {
  it('asks for the run’s pairs with the URL filter and links each pair', async () => {
    const calls = mockApi({
      ...staffViewer(['judge.moss_contest']),
      'GET /similarity/runs/run-9f02': ok(similarityRun()),
      'GET /similarity/runs/run-9f02/pairs': page([similarityPair()], { total: 1204 }),
    });
    const { wrapper } = await mountScreen(
      '/admin/similarity/runs/run-9f02/pairs?minPercent=70',
      (view) => view.find('a[href="/admin/similarity/pairs/pair-1"]').exists(),
    );
    const request = calls.find((call) => call.path.endsWith('/pairs'))!;
    expect(request.query.get('minSimilarity')).toBe('0.7');
    expect(wrapper.text()).toContain('1.204 cặp, độ tương đồng từ 70%');
    expect(wrapper.get('a[href="/admin/similarity/pairs/pair-1"]').text()).toBe('So sánh');
  });

  it('explains an empty result and resets the filter', async () => {
    mockApi({
      ...staffViewer(['judge.moss_contest']),
      'GET /similarity/runs/run-9f02': ok(similarityRun()),
      'GET /similarity/runs/run-9f02/pairs': page([]),
    });
    const { wrapper, router } = await mountScreen(
      '/admin/similarity/runs/run-9f02/pairs?minPercent=95',
      (view) => view.text().includes('Không có cặp nào từ 95% trở lên'),
    );
    expect(wrapper.text()).toContain('Không có cặp nào từ 95% trở lên');
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Đặt lại bộ lọc')!
      .trigger('click');
    await flushPromises();
    expect(router.currentRoute.value.query).toEqual({});
  });
});
