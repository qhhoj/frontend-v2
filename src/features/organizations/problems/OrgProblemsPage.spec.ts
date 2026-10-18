import { describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { failWithCode, mockApi, noContent, ok, rateLimited } from '@/test/mock-api';
import type { ApiCall } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { confirmDialog, openDialog } from '@/test/admin-routes';
import { signedInViewer } from '@/test/problem-routes';
import { ORG_PROBLEMS, TAGS, bulkResult, orgProblem, problemTag } from '@/test/f4-fixtures';
import { ADMIN_STATE, MEMBER_STATE, STRANGER_STATE, orgProblemRoutes } from '@/test/f4-routes';

type Wrapper = Awaited<ReturnType<typeof mountApp>>['wrapper'];
const LIST = '/organizations/lhp/problems';
const listCalls = (calls: ApiCall[]) => calls.filter((call) => call.path === LIST);
const TAG_LIST = '/organizations/lhp/problem-tags';
const tagCalls = (calls: ApiCall[]) => calls.filter((call) => call.path.startsWith(TAG_LIST));
const BULK = 'POST /organizations/lhp/problems/bulk';
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

async function fill(selector: string, value: string) {
  const input = openDialog().querySelector<HTMLInputElement>(selector)!;
  input.value = value;
  input.dispatchEvent(new Event('input'));
  await flushPromises();
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

describe('OrgProblemsPage', () => {
  it('shows a member the list read-only with the community Bit notice', async () => {
    mockApi({ ...signedInViewer(), ...orgProblemRoutes(MEMBER_STATE) });
    const { wrapper } = await mountTab();
    expect(wrapper.text()).toContain('Thành viên thường chỉ đọc');
    expect(wrapper.find('input[type="checkbox"]').exists()).toBe(false);
    expect(buttonNamed(wrapper, 'Sửa thẻ của lhp_lis')).toBeUndefined();
  });

  it('gives a pencil to the problem editor only on the rows the viewer may edit, member or not', async () => {
    const rows = [orgProblem({ canEdit: true }), orgProblem({ code: 'lhp_tree', name: 'Cây' })];
    mockApi({ ...signedInViewer(), ...orgProblemRoutes(MEMBER_STATE, rows) });
    const { wrapper } = await mountTab();
    const pencils = wrapper.findAll('[data-testid="problem-edit"]');
    expect(pencils).toHaveLength(1);
    expect(pencils[0]!.attributes('href')).toBe('/admin/problems/lhp_lis/general');
    expect(pencils[0]!.attributes('aria-label')).toBe('Sửa bài lhp_lis');
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
    await buttonNamed(wrapper, 'Xóa thẻ Cơ bản')!.trigger('click');
    await flushPromises();
    expect(openDialog().textContent).toContain('gỡ khỏi mọi bài');
    await confirmDialog('Xóa thẻ');
    expect(calls.some((call) => call.method === 'DELETE')).toBe(true);
    expect(calls.filter((call) => call.path === '/organizations/lhp/problems')).toHaveLength(2);
  });
});

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
    expect(wrapper.get('[data-testid="org-bulk-failure"]').text()).toContain('10 phút');
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

  describe('creating from the tab (P-32 B)', () => {
    const CREATOR_STATE = { ...ADMIN_STATE, canCreateProblem: true };

    it('offers a problem creator "Tạo bài tập" for this organization above the list', async () => {
      mockApi({ ...signedInViewer(), ...orgProblemRoutes(CREATOR_STATE) });
      const { wrapper } = await mountTab();
      const create = wrapper.get('[data-testid="org-tab-create-problem"]');
      expect(create.attributes('href')).toBe('/admin/problems/new?organization=lhp');
    });

    it('turns an empty list into a first step for a creator, and only explains it to the others', async () => {
      mockApi({ ...signedInViewer(), ...orgProblemRoutes(CREATOR_STATE, []) });
      const { wrapper } = await mountTab();
      expect(wrapper.text()).toContain('Tạo bài đầu tiên cho thành viên');
      expect(wrapper.findAll('[data-testid="org-tab-create-problem"]')).toHaveLength(1);
      mockApi({ ...signedInViewer(), ...orgProblemRoutes(MEMBER_STATE, []) });
      const member = await mountTab();
      expect(member.wrapper.text()).toContain('Liên hệ người quản lý bài');
      expect(member.wrapper.find('[data-testid="org-tab-create-problem"]').exists()).toBe(false);
    });
  });
});
