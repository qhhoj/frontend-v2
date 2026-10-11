import { describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { failWithCode, mockApi, ok, rateLimited } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { confirmDialog, openDialog } from '@/test/admin-routes';
import { signedInViewer } from '@/test/problem-routes';
import { TAGS, bulkResult } from '@/test/f4-fixtures';
import { orgProblemRoutes } from '@/test/f4-routes';

type Wrapper = Awaited<ReturnType<typeof mountApp>>['wrapper'];
const BULK = 'POST /organizations/lhp/problems/bulk';
async function mountTab() {
  const mounted = await mountApp('/organizations/lhp/problems');
  await flushPromises();
  await vi.waitFor(() => {
    expect(mounted.wrapper.find('[data-testid="org-problems-tab"]').exists()).toBe(true);
    expect(mounted.wrapper.find('[data-skeleton-region="org-problem-table"]').exists()).toBe(false);
  });
  await flushPromises();
  return mounted;
}
async function tick(wrapper: Wrapper, code: string) {
  await wrapper.get(`input[aria-label="Chọn ${code}"]`).setValue(true);
  await flushPromises();
}
const barButton = (wrapper: Wrapper, text: string) =>
  wrapper
    .get('[data-testid="org-bulk-bar"]')
    .findAll('button')
    .find((button) => button.text() === text)!;

describe('org bulk actions', () => {
  it('archives the ticked rows, reports every code and clears the bar', async () => {
    const calls = mockApi({
      ...signedInViewer(),
      ...orgProblemRoutes(),
      [BULK]: ok(
        bulkResult([
          ['lhp_lis', 'done'],
          ['lhp_tree', 'done'],
        ]),
      ),
    });
    const { wrapper } = await mountTab();
    await tick(wrapper, 'lhp_lis');
    await tick(wrapper, 'lhp_tree');
    expect(wrapper.get('[data-testid="org-bulk-bar"]').text()).toContain('Đã chọn 2 bài');
    await barButton(wrapper, 'Lưu trữ').trigger('click');
    await flushPromises();
    expect(calls.find((call) => call.method === 'POST')!.body).toEqual({
      codes: ['lhp_lis', 'lhp_tree'],
      action: 'archive',
    });
    const result = wrapper.get('[data-testid="org-bulk-result"]');
    expect(result.text()).toContain('2/2 thành công');
    expect(result.find('[data-testid="inline-bit"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="org-bulk-bar"]').exists()).toBe(false);
  });

  it('keeps a skipped code selected and says why it was skipped', async () => {
    mockApi({
      ...signedInViewer(),
      ...orgProblemRoutes(),
      [BULK]: ok(
        bulkResult([
          ['lhp_lis', 'done'],
          ['lhp_tree', 'skipped'],
        ]),
      ),
    });
    const { wrapper } = await mountTab();
    await tick(wrapper, 'lhp_lis');
    await tick(wrapper, 'lhp_tree');
    await barButton(wrapper, 'Bỏ lưu trữ').trigger('click');
    await flushPromises();
    const result = wrapper.get('[data-testid="org-bulk-result"]');
    expect(result.text()).toContain('1/2 thành công');
    expect(result.text()).toContain('lhp_tree không còn thuộc tổ chức này');
    expect(wrapper.get('[data-testid="org-bulk-bar"]').text()).toContain('Đã chọn 1 bài');
  });

  it('keeps the whole selection and names the wait after the hourly limit', async () => {
    mockApi({ ...signedInViewer(), ...orgProblemRoutes(), [BULK]: rateLimited(600) });
    const { wrapper } = await mountTab();
    await tick(wrapper, 'lhp_lis');
    await barButton(wrapper, 'Lưu trữ').trigger('click');
    await flushPromises();
    expect(wrapper.get('[data-testid="org-bulk-failure"]').text()).toContain('600');
    expect(wrapper.get('[data-testid="org-bulk-bar"]').text()).toContain('Đã chọn 1 bài');
  });

  it('says a tag is gone when the catalogue changed under the dialog, and keeps the selection', async () => {
    mockApi({
      ...signedInViewer(),
      ...orgProblemRoutes(),
      [BULK]: failWithCode(400, 'tagId', 'unknown_tag'),
    });
    const { wrapper } = await mountTab();
    await tick(wrapper, 'lhp_tree');
    await barButton(wrapper, 'Gắn thẻ…').trigger('click');
    await flushPromises();
    openDialog().querySelector<HTMLInputElement>(`input[value="${TAGS[1]!.id}"]`)!.click();
    await flushPromises();
    await confirmDialog('Áp dụng');
    expect(wrapper.get('[data-testid="org-bulk-failure"]').text()).toContain(
      'không còn trong danh mục',
    );
    expect(wrapper.get('[data-testid="org-bulk-bar"]').text()).toContain('Đã chọn 1 bài');
  });

  it('removes one tag from the ticked rows by its id', async () => {
    const calls = mockApi({
      ...signedInViewer(),
      ...orgProblemRoutes(),
      [BULK]: ok(bulkResult([['lhp_tree', 'done']])),
    });
    const { wrapper } = await mountTab();
    await tick(wrapper, 'lhp_tree');
    await barButton(wrapper, 'Gắn thẻ…').trigger('click');
    await flushPromises();
    openDialog().querySelector<HTMLInputElement>('input[value="remove-tag"]')!.click();
    openDialog().querySelector<HTMLInputElement>(`input[value="${TAGS[1]!.id}"]`)!.click();
    await flushPromises();
    await confirmDialog('Áp dụng');
    expect(calls.find((call) => call.method === 'POST')!.body).toEqual({
      codes: ['lhp_tree'],
      action: 'remove-tag',
      tagId: TAGS[1]!.id,
    });
  });

  it('drops the selection when the page changes, so the bar never counts rows that are not on screen', async () => {
    mockApi({ ...signedInViewer(), ...orgProblemRoutes() });
    const { wrapper, router } = await mountTab();
    await tick(wrapper, 'lhp_lis');
    expect(wrapper.find('[data-testid="org-bulk-bar"]').exists()).toBe(true);
    await router.push({ path: '/organizations/lhp/problems', query: { page: '2' } });
    await flushPromises();
    expect(wrapper.find('[data-testid="org-bulk-bar"]').exists()).toBe(false);
  });

  it('drops the selection when the viewer moves to another organization', async () => {
    const routes = orgProblemRoutes();
    mockApi({
      ...signedInViewer(),
      ...routes,
      ...Object.fromEntries(
        Object.entries(routes).map(([key, answer]) => [key.replace('/lhp', '/other'), answer]),
      ),
    });
    const { wrapper, router } = await mountTab();
    await tick(wrapper, 'lhp_lis');
    await router.push('/organizations/other/problems');
    await flushPromises();
    expect(wrapper.find('[data-testid="org-bulk-bar"]').exists()).toBe(false);
  });
});
