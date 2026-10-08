import { flushPromises } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { problemDetail, problemEditorial } from '@/test/fixtures';
import { mockApi, ok } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { anonymousViewer, problemPageRoutes } from '@/test/problem-routes';

const openEditorial = async (editorial = problemEditorial()) => {
  mockApi({
    ...anonymousViewer,
    ...problemPageRoutes(problemDetail()),
    'GET /problems/duongdi/editorial': ok(editorial),
  });
  const mounted = await mountApp('/problems/duongdi?tab=editorial');
  await vi.waitFor(() => expect(mounted.wrapper.find('.user-content').exists()).toBe(true));
  return mounted;
};

describe('editorial tab', () => {
  afterEach(() => Reflect.deleteProperty(navigator, 'clipboard'));

  it('renders the editorial HTML through UserContent, with authors and the publish date', async () => {
    const { wrapper } = await openEditorial();
    expect(wrapper.get('.user-content').text()).toContain('Dùng Dijkstra.');
    const meta = wrapper.get('[data-testid="editorial-meta"]').text();
    expect(meta).toContain('user_07');
    expect(meta).toContain('2026');
  });

  it('flags an editorial that only editors can see', async () => {
    const { wrapper } = await openEditorial(problemEditorial({ isPublic: false }));
    expect(wrapper.text()).toContain('Chỉ người chỉnh sửa thấy');
  });

  it('does not flag a public editorial', async () => {
    const { wrapper } = await openEditorial();
    expect(wrapper.text()).not.toContain('Chỉ người chỉnh sửa thấy');
  });

  it('shows the editorial with the same copy buttons as the statement', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      configurable: true,
    });
    const { wrapper } = await openEditorial(problemEditorial({ contentHtml: '<pre>1 2</pre>' }));
    await flushPromises();
    expect(wrapper.findAll('.user-content button.copy-block')).toHaveLength(1);
  });
});
