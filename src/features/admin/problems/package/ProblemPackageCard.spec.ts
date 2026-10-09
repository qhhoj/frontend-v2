import { describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { mockApi, ok } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { staffViewer } from '@/test/admin-routes';
import { problemData, problemEditorRoutes } from '@/test/admin-fixtures/problems';
import { packageStatus } from '@/test/f4-fixtures';

const EDIT = ['judge.edit_own_problem'];
const mountData = async () => {
  const mounted = await mountApp('/admin/problems/hcmus41c/data');
  await vi.waitFor(
    () => {
      if (!mounted.wrapper.find('[data-testid="problem-package"]').exists())
        throw new Error('not yet');
    },
    { timeout: 5000 },
  );
  await flushPromises();
  return mounted;
};

describe('ProblemPackageCard', () => {
  it('sits on the Data tab and offers the zip link once the package is ready', async () => {
    const calls = mockApi({
      ...staffViewer(EDIT),
      ...problemEditorRoutes(),
      'GET /problems/hcmus41c/data': ok(problemData()),
      'POST /problems/hcmus41c/package': ok(packageStatus('ready')),
    });
    const { wrapper } = await mountData();
    const card = wrapper.get('[data-testid="problem-package"]');
    await card
      .findAll('button')
      .find((button) => button.text() === 'Tải gói đề')!
      .trigger('click');
    await flushPromises();
    const link = card.get('a');
    expect(link.attributes('href')).toBe('/api/internal/problems/hcmus41c/package');
    expect(link.attributes('download')).toBe('hcmus41c.zip');
    expect(card.get('[role="status"]').text()).toContain('Gói đề đã sẵn sàng.');
    expect(calls.filter((call) => call.method === 'POST')).toHaveLength(1);
  });

  it('says it is packing while the server builds, with the judging Bit', async () => {
    mockApi({
      ...staffViewer(EDIT),
      ...problemEditorRoutes(),
      'GET /problems/hcmus41c/data': ok(problemData()),
      'POST /problems/hcmus41c/package': { status: 202, body: { data: packageStatus('building') } },
    });
    const { wrapper } = await mountData();
    const card = wrapper.get('[data-testid="problem-package"]');
    await card
      .findAll('button')
      .find((button) => button.text() === 'Tải gói đề')!
      .trigger('click');
    await flushPromises();
    expect(card.text()).toContain('Đang đóng gói');
    expect(card.get('button').attributes('aria-disabled')).toBe('true');
    expect(card.find('a').exists()).toBe(false);
  });
});
