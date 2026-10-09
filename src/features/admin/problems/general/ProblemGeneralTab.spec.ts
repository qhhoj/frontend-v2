import { describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { invalid, issue, mockApi, ok } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { staffViewer } from '@/test/admin-routes';
import {
  editableProblem,
  problemEditingMeta,
  problemEditorRoutes,
  TYPE_GRAPH,
} from '@/test/admin-fixtures/problems';

const EDIT = ['judge.edit_own_problem'];
const ALL = [...EDIT, 'judge.edit_all_problem'];

/** The shell, the editor and the tab load lazily: wait until the form field the test uses is on the page. */
const mountAdmin = async (path: string) => {
  const mounted = await mountApp(path);
  await vi.waitFor(() => {
    if (!mounted.wrapper.find('#problem-code').exists()) throw new Error('form not yet');
  });
  await flushPromises();
  return mounted;
};

const buttonLabelled = (wrapper: Awaited<ReturnType<typeof mountApp>>['wrapper'], label: string) =>
  wrapper.findAll('button').find((button) => button.text() === label)!;

describe('ProblemGeneralTab', () => {
  it('PATCHes only what changed and says it saved', async () => {
    const calls = mockApi({
      ...staffViewer(EDIT),
      ...problemEditorRoutes(),
      'PATCH /problems/hcmus41c': ok(editableProblem({ points: 1500 })),
    });
    const { wrapper } = await mountAdmin('/admin/problems/hcmus41c/general');
    await wrapper.get('#problem-points').setValue('1500');
    await buttonLabelled(wrapper, 'Lưu thay đổi').trigger('click');
    await flushPromises();
    expect(calls.find((call) => call.method === 'PATCH')?.body).toEqual({ points: 1500 });
    expect(wrapper.get('[role="status"]').text()).toContain('Đã lưu.');
  });

  it('puts a backend issue under its field and keeps the typed value', async () => {
    mockApi({
      ...staffViewer(EDIT),
      ...problemEditorRoutes(),
      'PATCH /problems/hcmus41c': invalid(issue('name', 'max_length', 'name must be shorter')),
    });
    const { wrapper } = await mountAdmin('/admin/problems/hcmus41c/general');
    await wrapper.get('#problem-name').setValue('x'.repeat(10));
    await buttonLabelled(wrapper, 'Lưu thay đổi').trigger('click');
    await flushPromises();
    expect(wrapper.get('#problem-name').attributes('aria-invalid')).toBe('true');
    expect(wrapper.text()).toContain('Quá dài.');
    expect((wrapper.get('#problem-name').element as HTMLInputElement).value).toBe('x'.repeat(10));
    expect(wrapper.find('[role="alert"]').exists()).toBe(true);
  });

  it('locks the allowed-languages list without judge.edit_all_problem and says why', async () => {
    mockApi({ ...staffViewer(EDIT), ...problemEditorRoutes() });
    const { wrapper } = await mountAdmin('/admin/problems/hcmus41c/general');
    expect(
      wrapper.find('fieldset[aria-describedby] input[type="checkbox"]').attributes('disabled'),
    ).toBeDefined();
    expect(wrapper.text()).toContain('Cần quyền judge.edit_all_problem');
  });

  it('locks the other staff-only basics (summary, og image, date, license) without judge.edit_all_problem, and unlocks them with it', async () => {
    mockApi({ ...staffViewer(EDIT), ...problemEditorRoutes() });
    const own = await mountAdmin('/admin/problems/hcmus41c/general');
    for (const id of ['#problem-summary', '#problem-ogImage', '#problem-date', '#problem-license'])
      expect(own.wrapper.get(id).attributes('disabled'), id).toBeDefined();
    own.wrapper.unmount();
    mockApi({ ...staffViewer(ALL), ...problemEditorRoutes() });
    const all = await mountAdmin('/admin/problems/hcmus41c/general');
    for (const id of ['#problem-summary', '#problem-ogImage', '#problem-date', '#problem-license'])
      expect(all.wrapper.get(id).attributes('disabled'), id).toBeUndefined();
  });

  it('clears a local check message as soon as the field is edited', async () => {
    mockApi({ ...staffViewer(EDIT), ...problemEditorRoutes() });
    const { wrapper } = await mountAdmin('/admin/problems/hcmus41c/general');
    await wrapper.get('#problem-points').setValue('700');
    await buttonLabelled(wrapper, 'Lưu thay đổi').trigger('click');
    expect(wrapper.text()).toContain('Từ 800 đến 3500.');
    await wrapper.get('#problem-points').setValue('900');
    expect(wrapper.text()).not.toContain('Từ 800 đến 3500.');
  });

  it('moves to the new address after the code changes', async () => {
    mockApi({
      ...staffViewer(EDIT),
      ...problemEditorRoutes(),
      'PATCH /problems/hcmus41c': ok(editableProblem({ code: 'hcmus41c2' })),
      'GET /problems/hcmus41c2': ok(editableProblem({ code: 'hcmus41c2' })),
    });
    const { wrapper, router } = await mountAdmin('/admin/problems/hcmus41c/general');
    await wrapper.get('#problem-code').setValue('hcmus41c2');
    await buttonLabelled(wrapper, 'Lưu thay đổi').trigger('click');
    await flushPromises();
    expect(router.currentRoute.value.fullPath).toBe('/admin/problems/hcmus41c2/general');
  });

  it('creates a problem from the new page, or sends a suggestion without judge.add_problem', async () => {
    const calls = mockApi({
      ...staffViewer(['judge.suggest_new_problem']),
      'GET /problems/meta': ok(problemEditingMeta()),
      'POST /problems/suggest': ok(editableProblem({ code: 'newp' })),
    });
    const { wrapper } = await mountAdmin('/admin/problems/new');
    expect(wrapper.findAll('button').some((button) => button.text() === 'Tạo bài')).toBe(false);
    await wrapper.get('#problem-code').setValue('newp');
    await wrapper.get('#problem-name').setValue('New');
    await wrapper.get('#problem-type-pick').setValue(TYPE_GRAPH);
    await buttonLabelled(wrapper, 'Thêm loại').trigger('click');
    await buttonLabelled(wrapper, 'Gửi đề xuất bài').trigger('click');
    await flushPromises();
    const body = calls.find((call) => call.path === '/problems/suggest')?.body;
    expect(body).toMatchObject({ code: 'newp', name: 'New', typeIds: [TYPE_GRAPH] });
    for (const field of [
      'authors',
      'curators',
      'bannedUsers',
      'allowedLanguages',
      'organizations',
      'licenseId',
      'summary',
      'date',
    ])
      expect(body, field).not.toHaveProperty(field);
    expect(wrapper.text()).toContain('Đã gửi đề xuất newp.');
  });
});
