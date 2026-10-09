import { describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { mockApi, ok } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { confirmDialog, openDialog, staffViewer, switchNamed } from '@/test/admin-routes';
import { editableProblem, problemEditorRoutes } from '@/test/admin-fixtures/problems';

/** The shell and the editorial tab load lazily: wait until the publish box is on the page. */
const mountAdmin = async (path: string) => {
  const mounted = await mountApp(path);
  await vi.waitFor(
    () => {
      if (!mounted.wrapper.find('#editorial-publishOn').exists()) throw new Error('tab not yet');
    },
    { timeout: 5000 },
  );
  await flushPromises();
  return mounted;
};

describe('ProblemEditorialTab', () => {
  it('seeds the stored editorial and saves the public flag, time, author ids and content', async () => {
    const problem = editableProblem();
    problem.editor!.solution = {
      isPublic: false,
      publishOn: '2026-10-08T06:00:00.000Z',
      authors: [{ id: 'id-thayhung', username: 'thayhung' }],
      content: 'Gọi $d[v][j]$…',
    };
    const calls = mockApi({
      ...staffViewer(['judge.edit_own_problem']),
      ...problemEditorRoutes(problem),
      'POST /problems/render-preview': ok({ html: '' }),
      'PUT /problems/hcmus41c/editorial': { status: 204 },
    });
    const { wrapper } = await mountAdmin('/admin/problems/hcmus41c/editorial');
    await switchNamed(wrapper, 'Công khai lời giải').trigger('click');
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Lưu lời giải')!
      .trigger('click');
    await flushPromises();
    expect(calls.find((call) => call.method === 'PUT')?.body).toEqual({
      isPublic: true,
      publishOn: '2026-10-08T06:00:00.000Z',
      authors: ['id-thayhung'],
      content: 'Gọi $d[v][j]$…',
    });
  });

  it('asks before a route leave with an unsaved editorial, and Leave goes', async () => {
    mockApi({
      ...staffViewer(['judge.edit_own_problem']),
      ...problemEditorRoutes(),
      'POST /problems/render-preview': ok({ html: '' }),
    });
    const { wrapper, router } = await mountAdmin('/admin/problems/hcmus41c/editorial');
    await wrapper.get('textarea').setValue('Sửa lời giải');
    await router.push('/admin/problems');
    await flushPromises();
    expect(openDialog().textContent).toContain('Rời khỏi bản nháp chưa lưu?');
    await confirmDialog('Rời trang');
    await vi.waitFor(() => expect(router.currentRoute.value.fullPath).toBe('/admin/problems'));
  });

  it('refuses editorial text over the backend length, sends nothing, and says why', async () => {
    const calls = mockApi({
      ...staffViewer(['judge.edit_own_problem']),
      ...problemEditorRoutes(),
      'POST /problems/render-preview': ok({ html: '' }),
      'PUT /problems/hcmus41c/editorial': { status: 204 },
    });
    const { wrapper } = await mountAdmin('/admin/problems/hcmus41c/editorial');
    await wrapper.get('textarea').setValue('x'.repeat(200_001));
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Lưu lời giải')!
      .trigger('click');
    await flushPromises();
    expect(calls.some((call) => call.method === 'PUT')).toBe(false);
    expect(wrapper.text()).toContain('Nội dung tối đa 200000 ký tự.');
  });
});
