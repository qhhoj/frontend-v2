import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { mockApi, ok, rateLimited } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { staffViewer } from '@/test/admin-routes';
import { editableProblem, problemEditorRoutes } from '@/test/admin-fixtures/problems';

const EDIT = ['judge.edit_own_problem'];
const PREVIEW = { 'POST /problems/render-preview': ok({ html: '<p>x</p>' }) };

/** The shell and the statements tab load lazily: wait until the language choice is on the page. */
const mountAdmin = async (path: string) => {
  const mounted = await mountApp(path);
  await vi.waitFor(() => {
    if (!mounted.wrapper.find('[role="radiogroup"]').exists()) throw new Error('tab not yet');
  });
  await flushPromises();
  return mounted;
};

const buttonLabelled = (wrapper: Awaited<ReturnType<typeof mountApp>>['wrapper'], label: string) =>
  wrapper.findAll('button').find((button) => button.text() === label)!;

const chooseFile = async (wrapper: Awaited<ReturnType<typeof mountApp>>['wrapper']) => {
  const input = wrapper.get('input[type="file"]');
  Object.defineProperty(input.element, 'files', {
    value: [new File(['x'], 'a.png', { type: 'image/png' })],
  });
  await input.trigger('change');
  await flushPromises();
};

describe('ProblemStatementsTab', () => {
  afterEach(() => vi.useRealTimers());

  it('marks English as missing, then saves it through PUT /translations/en', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const calls = mockApi({
      ...staffViewer(EDIT),
      ...problemEditorRoutes(),
      ...PREVIEW,
      'PUT /problems/hcmus41c/translations/en': { status: 204 },
    });
    const { wrapper } = await mountAdmin('/admin/problems/hcmus41c/statements');
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

  it('saves the original description through PATCH', async () => {
    const calls = mockApi({
      ...staffViewer(EDIT),
      ...problemEditorRoutes(),
      ...PREVIEW,
      'PATCH /problems/hcmus41c': ok(editableProblem()),
    });
    const { wrapper } = await mountAdmin('/admin/problems/hcmus41c/statements');
    await wrapper.get('[data-slot="original"]').trigger('click');
    await wrapper.get('textarea').setValue('Mới');
    await buttonLabelled(wrapper, 'Lưu mô tả gốc').trigger('click');
    await flushPromises();
    expect(calls.find((call) => call.method === 'PATCH')?.body).toEqual({ description: 'Mới' });
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

  it('uploads an image and inserts its URL into the text', async () => {
    mockApi({
      ...staffViewer(EDIT),
      ...problemEditorRoutes(),
      ...PREVIEW,
      'POST /problems/uploads/image': ok({ url: '/media/img/a.png' }),
    });
    const { wrapper } = await mountAdmin('/admin/problems/hcmus41c/statements');
    await chooseFile(wrapper);
    expect((wrapper.get('textarea').element as HTMLTextAreaElement).value).toContain(
      '![](/media/img/a.png)',
    );
  });

  it('tells how long to wait when the image upload is rate limited', async () => {
    mockApi({
      ...staffViewer(EDIT),
      ...problemEditorRoutes(),
      ...PREVIEW,
      'POST /problems/uploads/image': rateLimited(30),
    });
    const { wrapper } = await mountAdmin('/admin/problems/hcmus41c/statements');
    await chooseFile(wrapper);
    expect(wrapper.get('[role="alert"]').text()).toContain('Thử lại sau 30 giây.');
  });
});
