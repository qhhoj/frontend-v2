import { describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { mockApi, noContent } from '@/test/mock-api';
import type { ApiCall } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { confirmDialog, openDialog } from '@/test/admin-routes';
import { signedInViewer } from '@/test/problem-routes';
import { problemTag } from '@/test/f4-fixtures';
import { MEMBER_STATE, orgProblemRoutes } from '@/test/f4-routes';

type Wrapper = Awaited<ReturnType<typeof mountApp>>['wrapper'];
const TAG_LIST = '/organizations/lhp/problem-tags';
const tagCalls = (calls: ApiCall[]) => calls.filter((call) => call.path.startsWith(TAG_LIST));
const buttonNamed = (wrapper: Wrapper, name: string) =>
  wrapper.findAll('button').find((button) => button.attributes('aria-label') === name)!;
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
async function fill(selector: string, value: string) {
  const input = openDialog().querySelector<HTMLInputElement>(selector)!;
  input.value = value;
  input.dispatchEvent(new Event('input'));
  await flushPromises();
}

describe('OrgTagCatalogue', () => {
  it('hides the catalogue from a member', async () => {
    mockApi({ ...signedInViewer(), ...orgProblemRoutes(MEMBER_STATE) });
    const { wrapper } = await mountTab();
    expect(wrapper.find('[data-testid="org-tag-catalogue"]').exists()).toBe(false);
  });

  it('checks the form before sending, then creates the tag with its colour', async () => {
    const calls = mockApi({
      ...signedInViewer(),
      ...orgProblemRoutes(),
      [`POST ${TAG_LIST}`]: {
        status: 201,
        body: { data: problemTag({ slug: 'ds', color: 'tag-5' }) },
      },
    });
    const { wrapper } = await mountTab();
    await wrapper
      .findAll('button')
      .find((button) => button.text().includes('Thêm thẻ'))!
      .trigger('click');
    await flushPromises();
    await fill('#org-tag-slug', 'Bad Slug');
    await confirmDialog('Lưu thẻ');
    expect(openDialog().textContent).toContain('chữ thường');
    expect(calls.some((call) => call.method === 'POST')).toBe(false);
    await fill('#org-tag-slug', 'ds');
    await fill('#org-tag-name', 'Cấu trúc dữ liệu');
    openDialog().querySelector<HTMLInputElement>('input[aria-label="Màu 5"]')!.click();
    await confirmDialog('Lưu thẻ');
    expect(calls.find((call) => call.method === 'POST')!.body).toEqual({
      slug: 'ds',
      name: 'Cấu trúc dữ liệu',
      color: 'tag-5',
    });
    expect(tagCalls(calls).filter((call) => call.method === 'GET')).toHaveLength(2);
  });

  it('deletes after a confirm and reloads the problem rows', async () => {
    const calls = mockApi({
      ...signedInViewer(),
      ...orgProblemRoutes(),
      [`DELETE ${TAG_LIST}/cb`]: noContent(),
    });
    const { wrapper } = await mountTab();
    await buttonNamed(wrapper, 'Xóa thẻ Cơ bản').trigger('click');
    await flushPromises();
    expect(openDialog().textContent).toContain('gỡ khỏi mọi bài');
    await confirmDialog('Xóa thẻ');
    expect(calls.some((call) => call.method === 'DELETE')).toBe(true);
    expect(calls.filter((call) => call.path === '/organizations/lhp/problems')).toHaveLength(2);
  });
});
