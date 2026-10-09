import { describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { fail, mockApi, noContent, rateLimited } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { confirmDialog, openDialog, staffViewer } from '@/test/admin-routes';
import { invalidatedKeys, seedCache } from '@/test/cache-probe';
import { problemEditorRoutes } from '@/test/admin-fixtures/problems';
import { deletedListRoutes } from '@/test/f4-routes';

const EDIT = ['judge.edit_own_problem'];
const DELETE = [...EDIT, 'judge.delete_problem'];
const PATH = '/admin/problems/hcmus41c/general';
type Wrapper = Awaited<ReturnType<typeof mountApp>>['wrapper'];

const mountGeneral = async () => {
  const mounted = await mountApp(PATH);
  await vi.waitFor(
    () => {
      if (!mounted.wrapper.find('#problem-code').exists()) throw new Error('form not yet');
    },
    { timeout: 5000 },
  );
  await flushPromises();
  return mounted;
};
const openButton = (wrapper: Wrapper) =>
  wrapper.findAll('button').find((button) => button.text() === 'Xóa bài…');
const confirmButton = () =>
  [...openDialog().querySelectorAll<HTMLButtonElement>('button[type="submit"]')].find(
    (button) => button.textContent?.trim() === 'Xóa bài',
  )!;
async function typeCode(text: string) {
  const input = openDialog().querySelector('input')!;
  input.value = text;
  input.dispatchEvent(new Event('input'));
  await flushPromises();
}

describe('ProblemDangerZone', () => {
  it('is not offered without judge.delete_problem', async () => {
    mockApi({ ...staffViewer(EDIT), ...problemEditorRoutes() });
    const { wrapper } = await mountGeneral();
    expect(wrapper.text()).not.toContain('Vùng nguy hiểm');
    expect(openButton(wrapper)).toBeUndefined();
  });

  it('deletes only after the exact code is typed, once, then opens the deleted list', async () => {
    const calls = mockApi({
      ...staffViewer(DELETE),
      ...problemEditorRoutes(),
      ...deletedListRoutes(),
      'DELETE /problems/hcmus41c': noContent(),
    });
    const { wrapper, router } = await mountGeneral();
    await openButton(wrapper)!.trigger('click');
    await flushPromises();
    expect(confirmButton().getAttribute('aria-disabled')).toBe('true');
    await typeCode('hcmus41c ');
    expect(confirmButton().getAttribute('aria-disabled')).toBe('true');
    await typeCode('hcmus41c');
    confirmButton().click();
    confirmButton().click();
    await flushPromises();
    const deletes = calls.filter((call) => call.method === 'DELETE');
    expect(deletes).toHaveLength(1);
    expect(deletes[0]!.body).toEqual({ confirmCode: 'hcmus41c' });
    await vi.waitFor(() => expect(router.currentRoute.value.name).toBe('admin-problemsDeleted'));
  });

  it('marks cached submission pages stale, as they still say the problem exists', async () => {
    mockApi({
      ...staffViewer(DELETE),
      ...problemEditorRoutes(),
      ...deletedListRoutes(),
      'DELETE /problems/hcmus41c': noContent(),
    });
    const { wrapper, queryClient } = await mountGeneral();
    const keys = [['submissions', 'detail', 'probe']];
    seedCache(queryClient, keys);
    await openButton(wrapper)!.trigger('click');
    await typeCode('hcmus41c');
    await confirmDialog('Xóa bài');
    await flushPromises();
    expect(invalidatedKeys(queryClient, keys)).toEqual(keys);
  });

  it('keeps the dialog open with the typed code when the problem is in a contest', async () => {
    mockApi({
      ...staffViewer(DELETE),
      ...problemEditorRoutes(),
      'DELETE /problems/hcmus41c': fail(409, 'problem_in_contest'),
    });
    const { wrapper } = await mountGeneral();
    await openButton(wrapper)!.trigger('click');
    await typeCode('hcmus41c');
    await confirmDialog('Xóa bài');
    expect(openDialog().textContent).toContain('Gỡ bài khỏi kỳ thi trước');
    expect(openDialog().querySelector('input')!.value).toBe('hcmus41c');
  });

  it('names the wait when the delete limit is reached', async () => {
    mockApi({
      ...staffViewer(DELETE),
      ...problemEditorRoutes(),
      'DELETE /problems/hcmus41c': rateLimited(1200),
    });
    const { wrapper } = await mountGeneral();
    await openButton(wrapper)!.trigger('click');
    await typeCode('hcmus41c');
    await confirmDialog('Xóa bài');
    expect(openDialog().textContent).toContain('1200');
  });
});
