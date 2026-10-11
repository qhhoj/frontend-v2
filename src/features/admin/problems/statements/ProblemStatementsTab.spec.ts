import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { mockApi, ok } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { invalidatedKeys, seedCache } from '@/test/cache-probe';
import { cancelDialog, confirmDialog, openDialog, staffViewer } from '@/test/admin-routes';
import { editableProblem, problemData, problemEditorRoutes } from '@/test/admin-fixtures/problems';

const EDIT = ['judge.edit_own_problem'];
const PREVIEW = { 'POST /problems/render-preview': ok({ html: '<p>x</p>' }) };

/** The shell and the statements tab load lazily: wait until the language choice is on the page. */
const mountAdmin = async (path: string) => {
  const mounted = await mountApp(path);
  await vi.waitFor(
    () => {
      if (!mounted.wrapper.find('[role="radiogroup"]').exists()) throw new Error('tab not yet');
    },
    { timeout: 5000 },
  );
  await flushPromises();
  return mounted;
};

const buttonLabelled = (wrapper: Awaited<ReturnType<typeof mountApp>>['wrapper'], label: string) =>
  wrapper.findAll('button').find((button) => button.text() === label)!;

describe('ProblemStatementsTab', () => {
  afterEach(() => vi.useRealTimers());

  it('saves a missing English translation through PUT and marks public problem pages stale', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const calls = mockApi({
      ...staffViewer(EDIT),
      ...problemEditorRoutes(),
      ...PREVIEW,
      'PUT /problems/hcmus41c/translations/en': { status: 204 },
    });
    const { wrapper, queryClient } = await mountAdmin('/admin/problems/hcmus41c/statements');
    seedCache(queryClient, [['problems', 'detail', 'probe']]);
    expect(wrapper.get('[data-slot="en"]').text()).toContain('chưa có');
    await wrapper.get('[data-slot="en"]').trigger('click');
    await wrapper.get('#statement-name').setValue('Constrained shortest path');
    await wrapper.get('textarea').setValue('Given a graph.');
    await buttonLabelled(wrapper, 'Lưu bản dịch tiếng Anh').trigger('click');
    await flushPromises();
    expect(calls.find((call) => call.method === 'PUT')?.body).toEqual({
      name: 'Constrained shortest path',
      description: 'Given a graph.',
    });
    expect(wrapper.get('[role="status"]').text()).toContain('Đã lưu.');
    expect(invalidatedKeys(queryClient, [['problems', 'detail', 'probe']])).toHaveLength(1);
  });

  it('never asks for problem-full without judge.problem_full_markup', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const calls = mockApi({
      ...staffViewer(EDIT),
      ...problemEditorRoutes(editableProblem({ isFullMarkup: true })),
      ...PREVIEW,
    });
    await mountAdmin('/admin/problems/hcmus41c/statements');
    await vi.advanceTimersByTimeAsync(600);
    await flushPromises();
    const styles = calls
      .filter((call) => call.path === '/problems/render-preview')
      .map((call) => (call.body as { style: string }).style);
    expect(styles).toEqual(['problem']);
  });

  it('will not send the original description of a full-markup problem for a viewer without judge.problem_full_markup', async () => {
    const calls = mockApi({
      ...staffViewer(EDIT),
      ...problemEditorRoutes(editableProblem({ isFullMarkup: true })),
      ...PREVIEW,
      'PATCH /problems/hcmus41c': ok(editableProblem()),
    });
    const { wrapper } = await mountAdmin('/admin/problems/hcmus41c/statements');
    await wrapper.get('[data-slot="original"]').trigger('click');
    await wrapper.get('textarea').setValue('Mới');
    const saveOriginal = buttonLabelled(wrapper, 'Lưu mô tả gốc');
    expect(saveOriginal.attributes('aria-disabled')).toBe('true');
    expect(wrapper.text()).toContain('Cần quyền judge.problem_full_markup');
    await saveOriginal.trigger('click');
    await flushPromises();
    expect(calls.some((call) => call.method === 'PATCH')).toBe(false);
  });

  it('locks a changed translation description of a full-markup problem without judge.problem_full_markup, but not a name-only change', async () => {
    const calls = mockApi({
      ...staffViewer(EDIT),
      ...problemEditorRoutes(editableProblem({ isFullMarkup: true })),
      ...PREVIEW,
      'PUT /problems/hcmus41c/translations/vi': { status: 204 },
    });
    const { wrapper } = await mountAdmin('/admin/problems/hcmus41c/statements');
    await wrapper.get('textarea').setValue('Mô tả mới');
    const save = buttonLabelled(wrapper, 'Lưu bản dịch tiếng Việt');
    expect(save.attributes('aria-disabled')).toBe('true');
    expect(wrapper.text()).toContain('Cần quyền judge.problem_full_markup');
    await save.trigger('click');
    await flushPromises();
    expect(calls.some((call) => call.method === 'PUT')).toBe(false);
    await buttonLabelled(wrapper, 'Hủy thay đổi').trigger('click');
    await wrapper.get('#statement-name').setValue('Tên mới');
    await buttonLabelled(wrapper, 'Lưu bản dịch tiếng Việt').trigger('click');
    await flushPromises();
    expect(calls.find((call) => call.method === 'PUT')?.body).toMatchObject({ name: 'Tên mới' });
  });

  it('asks before a tab switch with an unsaved statement; Stay keeps the draft, Leave goes', async () => {
    mockApi({
      ...staffViewer(EDIT),
      ...problemEditorRoutes(),
      ...PREVIEW,
      'GET /problems/hcmus41c/data': ok(problemData()),
    });
    const { wrapper, router } = await mountAdmin('/admin/problems/hcmus41c/statements');
    await wrapper.get('textarea').setValue('Đang sửa');
    const toData = () => wrapper.get('a[href="/admin/problems/hcmus41c/data"]');
    await toData().trigger('click');
    await flushPromises();
    expect(openDialog().textContent).toContain('Rời khỏi bản nháp chưa lưu?');
    await cancelDialog('Ở lại');
    expect(router.currentRoute.value.fullPath).toBe('/admin/problems/hcmus41c/statements');
    expect((wrapper.get('textarea').element as HTMLTextAreaElement).value).toBe('Đang sửa');
    await toData().trigger('click');
    await flushPromises();
    await confirmDialog('Rời trang');
    expect(router.currentRoute.value.fullPath).toBe('/admin/problems/hcmus41c/data');
  });
});
