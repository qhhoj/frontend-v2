import { flushPromises } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { fail, mockApi } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { staffViewer } from '@/test/admin-routes';
import { editableProblem, problemEditorRoutes } from '@/test/admin-fixtures/problems';

const TABS = '[aria-label="Các phần của bài"]';
const EDIT = ['judge.edit_own_problem'];

/** AdminShell and the screen load lazily: wait for the shell, then for the queries the page sends. */
const mountAdmin = async (path: string) => {
  const mounted = await mountApp(path);
  await vi.waitFor(() => {
    if (!mounted.wrapper.find('[data-testid="admin-topbar"]').exists())
      throw new Error('shell not yet');
  });
  await flushPromises();
  return mounted;
};

describe('ProblemEditorPage', () => {
  it('shows the code, the name, the five tabs and a link to the public page', async () => {
    mockApi({ ...staffViewer(EDIT), ...problemEditorRoutes() });
    const { wrapper } = await mountAdmin('/admin/problems/hcmus41c/general');
    expect(wrapper.find('h1').text()).toBe('Đường đi ngắn nhất có ràng buộc');
    expect(wrapper.findAll(`${TABS} a`).map((tab) => tab.attributes('href'))).toEqual([
      '/admin/problems/hcmus41c/general',
      '/admin/problems/hcmus41c/statements',
      '/admin/problems/hcmus41c/editorial',
      '/admin/problems/hcmus41c/data',
      '/admin/problems/hcmus41c/files',
    ]);
    expect(wrapper.find('a[href="/problems/hcmus41c"]').text()).toBe('Xem bài');
    expect(wrapper.find(`${TABS} [aria-current="page"]`).attributes('href')).toBe(
      '/admin/problems/hcmus41c/general',
    );
  });

  it('opens /admin/problems/<code> on the general tab', async () => {
    mockApi({ ...staffViewer(EDIT), ...problemEditorRoutes() });
    const { router } = await mountAdmin('/admin/problems/hcmus41c');
    expect(router.currentRoute.value.fullPath).toBe('/admin/problems/hcmus41c/general');
  });

  it('says so, with Bit, when the account may not edit this problem', async () => {
    // A viewer who may edit has `canEdit` and the editor block; either missing means the tabs must not open.
    mockApi({
      ...staffViewer(EDIT),
      ...problemEditorRoutes(editableProblem({ canEdit: true, editor: null })),
    });
    const { wrapper } = await mountAdmin('/admin/problems/hcmus41c/general');
    expect(wrapper.text()).toContain('Tài khoản này không sửa được bài hcmus41c.');
    expect(wrapper.find('[data-placement="forbidden"]').exists()).toBe(true);
  });

  it('shows not found for an unknown code', async () => {
    mockApi({
      ...staffViewer(EDIT),
      'GET /problems/nope': fail(404, 'not_found'),
      'GET /problems/meta': problemEditorRoutes()['GET /problems/meta'],
    });
    const { wrapper } = await mountAdmin('/admin/problems/nope/general');
    expect(wrapper.text()).toContain('Không tìm thấy bài nope.');
  });

  it('opens a problem typed into the index lookup', async () => {
    mockApi({ ...staffViewer(['judge.add_problem', ...EDIT]), ...problemEditorRoutes() });
    const { wrapper, router } = await mountAdmin('/admin/problems');
    await wrapper.get('input').setValue(' hcmus41c ');
    await wrapper.get('form').trigger('submit');
    await flushPromises();
    expect(router.currentRoute.value.fullPath).toBe('/admin/problems/hcmus41c/general');
    expect(wrapper.find('h1').text()).toBe('Đường đi ngắn nhất có ràng buộc');
  });
});
