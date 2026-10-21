import { describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { fail, mockApi, ok } from '@/test/mock-api';
import type { MockResponse } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { confirmDialog, staffViewer } from '@/test/admin-routes';
import { importJob, polygonProblem } from '@/test/admin-fixtures/polygon';
import { editableProblem, problemEditingMeta } from '@/test/admin-fixtures/problems';

type Wrapper = Awaited<ReturnType<typeof mountApp>>['wrapper'];

const LINK = 'https://polygon.codeforces.com/p3n21nw/bitcoder/kminmax';
const statement = (language: string, hasTutorial = false) => ({
  language,
  title: null,
  hasTutorial,
});
const THREE_STATEMENTS = polygonProblem({
  name: 'kminmax',
  statements: [statement('english', true), statement('russian'), statement('vietnamese', true)],
});
const PERMISSIONS = ['judge.add_problem', 'judge.edit_own_problem', 'judge.sync_polygon_problem'];

/** The wizard on step 2 for a checked link; `importAnswer` answers the start. */
async function openOptions(importAnswer: MockResponse = ok({ jobId: 'job-1' })) {
  const calls = mockApi({
    ...staffViewer(PERMISSIONS),
    'GET /polygon/status': ok({ connected: true, accountName: 'bitcoder' }),
    'GET /problems/imports': ok([]),
    'GET /problems/meta': ok(problemEditingMeta()),
    'POST /polygon/resolve': ok(THREE_STATEMENTS),
    'POST /polygon/import': importAnswer,
    'GET /problems/imports/job-1': ok(importJob({ code: 'kminmax' })),
    'GET /problems/abc': ok(editableProblem({ code: 'abc', name: 'Dãy con có tổng lớn nhất' })),
    'GET /problems/kminmax': fail(404, 'not_found'),
  });
  const { wrapper } = await mountApp('/admin/problems/polygon');
  await vi.waitFor(() => expect(wrapper.find('#polygon-link').exists()).toBe(true), {
    timeout: 5000,
  });
  await wrapper.get('#polygon-link').setValue(LINK);
  await vi.waitFor(
    () => expect(wrapper.find('[data-testid="polygon-link-preview"]').exists()).toBe(true),
    { timeout: 5000 },
  );
  await buttonLabelled(wrapper, 'Tiếp tục').trigger('click');
  await vi.waitFor(() =>
    expect(wrapper.find('[data-testid="polygon-languages"]').exists()).toBe(true),
  );
  return { wrapper, calls };
}
const buttonLabelled = (wrapper: Wrapper, label: string) =>
  wrapper.findAll('button').find((button) => button.text() === label)!;
const selectLabelled = (wrapper: Wrapper, label: string) => {
  const id = wrapper
    .findAll('label')
    .find((item) => item.text() === label)!
    .attributes('for');
  return wrapper.get(`select#${id}`);
};
const importBodies = (calls: Awaited<ReturnType<typeof openOptions>>['calls']) =>
  calls.filter((call) => call.path === '/polygon/import').map((call) => call.body);

describe('Polygon configure step', () => {
  it("starts with the preview's languages chosen and sends them with the import", async () => {
    const { wrapper, calls } = await openOptions();
    expect((selectLabelled(wrapper, 'Đề chính').element as HTMLSelectElement).value).toBe(
      'vietnamese',
    );
    await wrapper.get('form').trigger('submit');
    await flushPromises();
    expect(importBodies(calls)).toEqual([
      expect.objectContaining({
        link: LINK,
        code: 'kminmax',
        mode: 'create',
        mainStatementLanguage: 'vietnamese',
        statementLanguages: ['english=en', 'russian=skip'],
        tutorialLanguage: 'vietnamese',
      }),
    ]);
  });

  it('refuses two statements in one site language under the second, without asking the server', async () => {
    const { wrapper, calls } = await openOptions();
    await selectLabelled(wrapper, 'russian').setValue('en');
    await wrapper.get('form').trigger('submit');
    await flushPromises();
    expect(wrapper.text()).toContain('Đề khác đã là Tiếng Anh (en)');
    expect(importBodies(calls)).toEqual([]);
  });

  it("puts the server's language refusal under the statement it names", async () => {
    const { wrapper } = await openOptions(
      fail(400, 'statement_language_unmapped', undefined, undefined, {
        params: { language: 'russian' },
      }),
    );
    await wrapper.get('form').trigger('submit');
    await flushPromises();
    expect(wrapper.text()).toContain('Chọn ngôn ngữ trên QHHOJ hoặc Bỏ qua cho đề russian.');
  });

  it('names the update target and starts the update only after the overwrite is confirmed', async () => {
    const { wrapper, calls } = await openOptions();
    await wrapper.get('input[name="import-mode"][value="update"]').setValue();
    await vi.waitFor(() =>
      expect(wrapper.get('[data-testid="polygon-update-target"]').text()).toContain(
        'Không tìm thấy bài kminmax',
      ),
    );
    await wrapper.get('#import-code').setValue('abc');
    await vi.waitFor(() =>
      expect(wrapper.get('[data-testid="polygon-update-target"]').text()).toContain(
        'Dãy con có tổng lớn nhất',
      ),
    );
    expect(buttonLabelled(wrapper, 'Cập nhật abc…').exists()).toBe(true);
    await wrapper.get('form').trigger('submit');
    await flushPromises();
    expect(document.body.querySelector('[role="dialog"]')?.textContent).toContain(
      'Ghi đè abc bằng gói Polygon?',
    );
    expect(importBodies(calls)).toEqual([]);
    await confirmDialog('Ghi đè abc và nhập');
    expect(importBodies(calls)).toEqual([expect.objectContaining({ code: 'abc', mode: 'update' })]);
  });
});
