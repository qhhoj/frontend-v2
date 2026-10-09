import { describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { mockApi, noContent, ok } from '@/test/mock-api';
import type { ApiCall } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { confirmDialog, openDialog } from '@/test/admin-routes';
import { loginRoutes } from '@/test/auth-routes';
import { anonymousViewer, signedInViewer } from '@/test/problem-routes';
import { ORG_PROBLEMS, TAGS } from '@/test/f4-fixtures';
import { MEMBER_STATE, STRANGER_STATE, orgProblemRoutes } from '@/test/f4-routes';

type Wrapper = Awaited<ReturnType<typeof mountApp>>['wrapper'];
const LIST = '/organizations/lhp/problems';
const listCalls = (calls: ApiCall[]) => calls.filter((call) => call.path === LIST);
const lastQuery = (calls: ApiCall[]) => listCalls(calls).at(-1)!.query;
const buttonNamed = (wrapper: Wrapper, name: string) =>
  wrapper.findAll('button').find((button) => button.attributes('aria-label') === name);
const buttonText = (wrapper: Wrapper, text: string) =>
  wrapper.findAll('button').find((button) => button.text().startsWith(text))!;

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
  it('shows an admin the rows with tag chips, selection boxes and row actions', async () => {
    const calls = mockApi({ ...signedInViewer(), ...orgProblemRoutes() });
    const { wrapper } = await mountTab();
    expect(wrapper.text()).toContain('Dãy con tăng dài nhất');
    expect(wrapper.get('tbody').text()).toContain('Quy hoạch động');
    expect(wrapper.get('thead').text()).toContain('Cập nhật');
    expect(wrapper.get('tbody').text()).toContain('2026');
    expect(wrapper.findAll('tbody input[type="checkbox"]')).toHaveLength(ORG_PROBLEMS.length);
    expect(buttonNamed(wrapper, 'Lưu trữ lhp_lis')).toBeDefined();
    expect([lastQuery(calls).get('archived'), lastQuery(calls).get('page')]).toEqual([
      'false',
      '1',
    ]);
    expect(lastQuery(calls).has('tag')).toBe(false);
  });

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

  it('sends anonymous visitors to sign in', async () => {
    mockApi({ ...anonymousViewer, ...loginRoutes });
    const { router } = await mountApp(LIST);
    await vi.waitFor(() => expect(router.currentRoute.value.name).toBe('login'));
  });

  it('filters by tag and archive state through the URL, back on page 1', async () => {
    const calls = mockApi({ ...signedInViewer(), ...orgProblemRoutes() });
    const { wrapper, router } = await mountTab(`${LIST}?page=2`);
    await buttonText(wrapper, 'Đồ thị').trigger('click');
    await flushPromises();
    expect(router.currentRoute.value.query).toEqual({ tag: 'dt' });
    expect(lastQuery(calls).get('tag')).toBe('dt');
    await buttonText(wrapper, 'Đã lưu trữ').trigger('click');
    await flushPromises();
    expect(router.currentRoute.value.query).toEqual({ tag: 'dt', archived: 'true' });
    expect(lastQuery(calls).get('archived')).toBe('true');
  });

  it('searches by the submitted text', async () => {
    const calls = mockApi({ ...signedInViewer(), ...orgProblemRoutes() });
    const { wrapper, router } = await mountTab();
    await wrapper.get('input[type="search"]').setValue('  cây ');
    await wrapper.get('form[role="search"]').trigger('submit');
    await flushPromises();
    expect(router.currentRoute.value.query).toEqual({ q: 'cây' });
    expect(lastQuery(calls).get('q')).toBe('cây');
  });

  it('says the organization has no problems and offers the archived ones', async () => {
    mockApi({ ...signedInViewer(), ...orgProblemRoutes(undefined, []) });
    const { wrapper } = await mountTab();
    expect(wrapper.get('[data-testid="state-panel"]').attributes('data-state')).toBe('empty');
    expect(wrapper.text()).toContain('Tổ chức chưa có bài tập nào');
    expect(wrapper.findAll('button').some((button) => button.text() === 'Xem đã lưu trữ')).toBe(
      true,
    );
  });

  it('names the tag when a tag filter finds nothing', async () => {
    mockApi({ ...signedInViewer(), ...orgProblemRoutes(undefined, []) });
    const { wrapper } = await mountTab(`${LIST}?tag=dt`);
    expect(wrapper.text()).toContain('Không có bài nào với thẻ “Đồ thị” đang dùng.');
    expect(wrapper.find('[data-testid="inline-bit"]').exists()).toBe(true);
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

  it('keeps the skeleton rows while the list loads', async () => {
    mockApi({ ...signedInViewer(), ...orgProblemRoutes() });
    const answer = globalThis.fetch;
    vi.stubGlobal('fetch', (input: string, init?: RequestInit) =>
      String(input).includes(`${LIST}?`) ? new Promise<Response>(() => {}) : answer(input, init),
    );
    const { wrapper } = await mountApp(LIST);
    await flushPromises();
    expect(wrapper.findAll('[data-skeleton-region="org-problem-table"]')).toHaveLength(1);
  });
});
