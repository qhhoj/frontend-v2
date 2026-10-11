import { describe, expect, it, vi } from 'vitest';
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
  it('flags an editorial that only editors can see', async () => {
    const { wrapper } = await openEditorial(problemEditorial({ isPublic: false }));
    expect(wrapper.text()).toContain('Chỉ người chỉnh sửa thấy');
  });
});
