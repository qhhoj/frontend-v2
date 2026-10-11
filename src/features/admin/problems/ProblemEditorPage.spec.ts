import { flushPromises } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { mockApi } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { staffViewer } from '@/test/admin-routes';
import { sessionUser } from '@/test/fixtures';
import { useSessionStore } from '@/stores/session.store';
import { editableProblem, problemEditorRoutes } from '@/test/admin-fixtures/problems';

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
  it('says so when the detail has no editor block', async () => {
    // A viewer who may edit has `canEdit` and the editor block; either missing means the tabs must not open.
    mockApi({
      ...staffViewer(EDIT),
      ...problemEditorRoutes(editableProblem({ canEdit: true, editor: null })),
    });
    const { wrapper } = await mountAdmin('/admin/problems/hcmus41c/general');
    expect(wrapper.text()).toContain('Tài khoản này không sửa được bài hcmus41c.');
    expect(wrapper.find('[data-placement="forbidden"]').exists()).toBe(true);
  });

  it('keeps the problem per viewer: another viewer asks again and gets its own entry', async () => {
    const calls = mockApi({ ...staffViewer(EDIT), ...problemEditorRoutes() });
    const { wrapper, queryClient } = await mountAdmin('/admin/problems/hcmus41c/general');
    const detailReads = () =>
      calls.filter((call) => call.method === 'GET' && call.path === '/problems/hcmus41c').length;
    expect(detailReads()).toBe(1);
    const otherViewer = '0192a000-0000-7000-8000-00000000a002';
    useSessionStore().user = sessionUser({ id: otherViewer, permissions: EDIT });
    await flushPromises();
    expect(detailReads()).toBe(2);
    expect(queryClient.getQueryData(['admin', 'problem', 'hcmus41c', otherViewer])).toBeDefined();
    expect(wrapper.find('h1').text()).toBe('Đường đi ngắn nhất có ràng buộc');
  });

  it('refuses a detail that says the account cannot edit, even with an editor block', async () => {
    mockApi({ ...staffViewer(EDIT), ...problemEditorRoutes(editableProblem({ canEdit: false })) });
    const { wrapper } = await mountAdmin('/admin/problems/hcmus41c/general');
    expect(wrapper.text()).toContain('Tài khoản này không sửa được bài hcmus41c.');
    expect(wrapper.find('[data-placement="forbidden"]').exists()).toBe(true);
  });
});
