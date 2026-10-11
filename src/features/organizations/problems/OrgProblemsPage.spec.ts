import { describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { mockApi, noContent, ok } from '@/test/mock-api';
import type { ApiCall } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { confirmDialog, openDialog } from '@/test/admin-routes';
import { signedInViewer } from '@/test/problem-routes';
import { ORG_PROBLEMS, TAGS } from '@/test/f4-fixtures';
import { MEMBER_STATE, STRANGER_STATE, orgProblemRoutes } from '@/test/f4-routes';

type Wrapper = Awaited<ReturnType<typeof mountApp>>['wrapper'];
const LIST = '/organizations/lhp/problems';
const listCalls = (calls: ApiCall[]) => calls.filter((call) => call.path === LIST);
const buttonNamed = (wrapper: Wrapper, name: string) =>
  wrapper.findAll('button').find((button) => button.attributes('aria-label') === name);

async function mountTab(path = LIST) {
  const mounted = await mountApp(path);
  await flushPromises();
  await vi.waitFor(() => {
    expect(mounted.wrapper.find('[data-testid="org-problems-tab"]').exists()).toBe(true);
    expect(mounted.wrapper.find('[data-skeleton-region="org-problem-table"]').exists()).toBe(false);
  });
  await flushPromises();
  return mounted;
}

describe('OrgProblemsPage', () => {
  it('shows a member the list read-only with the community Bit notice', async () => {
    mockApi({ ...signedInViewer(), ...orgProblemRoutes(MEMBER_STATE) });
    const { wrapper } = await mountTab();
    expect(wrapper.text()).toContain('Thành viên thường chỉ đọc');
    expect(wrapper.find('input[type="checkbox"]').exists()).toBe(false);
    expect(buttonNamed(wrapper, 'Sửa thẻ của lhp_lis')).toBeUndefined();
  });

  it('shows a stranger the forbidden state and never asks for the list', async () => {
    const calls = mockApi({ ...signedInViewer(), ...orgProblemRoutes(STRANGER_STATE) });
    const { wrapper } = await mountApp(LIST);
    await flushPromises();
    expect(wrapper.get('[data-testid="state-panel"]').attributes('data-state')).toBe('forbidden');
    expect(listCalls(calls)).toHaveLength(0);
  });

  it('archives one row and reloads the list', async () => {
    const calls = mockApi({
      ...signedInViewer(),
      ...orgProblemRoutes(),
      'POST /organizations/lhp/problems/lhp_lis/archive': noContent(),
    });
    const { wrapper } = await mountTab();
    await buttonNamed(wrapper, 'Lưu trữ lhp_lis')!.trigger('click');
    await flushPromises();
    expect(calls.filter((call) => call.method === 'POST')).toHaveLength(1);
    expect(listCalls(calls)).toHaveLength(2);
  });

  it('puts the checked tag ids on one problem', async () => {
    const calls = mockApi({
      ...signedInViewer(),
      ...orgProblemRoutes(),
      'PUT /organizations/lhp/problems/lhp_tree/tags': ok(ORG_PROBLEMS[1]),
    });
    const { wrapper } = await mountTab();
    await buttonNamed(wrapper, 'Sửa thẻ của lhp_tree')!.trigger('click');
    await flushPromises();
    const label = [...openDialog().querySelectorAll('label')].find((candidate) =>
      candidate.textContent?.includes('Cơ bản'),
    )!;
    label.querySelector('input')!.click();
    await flushPromises();
    await confirmDialog('Lưu thẻ');
    expect(calls.find((call) => call.method === 'PUT')!.body).toEqual({
      tagIds: [TAGS[1]!.id, TAGS[2]!.id],
    });
  });
});
