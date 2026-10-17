import { describe, expect, it } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { invalidatedKeys, seedCache } from '@/test/cache-probe';
import { fail, mockApi, ok } from '@/test/mock-api';
import { staffViewer } from '@/test/admin-routes';
import {
  contestEditorRoutes,
  contestProblem,
  editableContest,
} from '@/test/admin-fixtures/contests';
import { mountAndWaitFor } from '@/test/admin-contest-mount';

const EDIT = ['judge.edit_own_contest'];
const WARNING = 'Đổi điểm hoặc cách tính khi kỳ thi đã có bài nộp không tự tính lại.';

describe('ContestProblemsTab', () => {
  it('adds a problem by code under the next label, saves the whole list and marks the public contest pages stale', async () => {
    const calls = mockApi({
      ...staffViewer(EDIT),
      ...contestEditorRoutes(),
      'GET /problems/hcmus41d': ok({
        id: 'id-d',
        code: 'hcmus41d',
        name: 'Xâu con chung dài nhất',
      }),
      'PATCH /contests/hcmus-w41': ok(editableContest()),
    });
    const { wrapper, queryClient } = await mountAndWaitFor(
      '/admin/contests/hcmus-w41/problems',
      WARNING,
    );
    seedCache(queryClient, [['contests', 'detail', 'probe']]);
    await wrapper.get('#contest-add-problem').setValue('hcmus41d');
    await wrapper.get('#contest-add-problem').trigger('keydown', { key: 'Enter' });
    await flushPromises();
    expect(wrapper.findAll('tbody tr').at(-1)!.text()).toContain('D');
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Lưu bài trong kỳ thi')!
      .trigger('click');
    await flushPromises();
    const body = calls.find((call) => call.method === 'PATCH')!.body as {
      problems: { problem: string }[];
    };
    expect(Object.keys(body)).toEqual(['problems']);
    expect(body.problems.map((row) => row.problem).at(-1)).toBe('id-d');
    expect(invalidatedKeys(queryClient, [['contests', 'detail', 'probe']])).toHaveLength(1);
  });

  it('says a code does not exist and does not add it twice', async () => {
    mockApi({
      ...staffViewer(EDIT),
      ...contestEditorRoutes(),
      'GET /problems/nope': fail(404, 'not_found'),
      'GET /problems/hcmus41a': ok({
        id: editableContest().problems![0]!.problemId,
        code: 'hcmus41a',
        name: 'x',
      }),
    });
    const { wrapper } = await mountAndWaitFor('/admin/contests/hcmus-w41/problems', WARNING);
    for (const code of ['nope', 'hcmus41a']) {
      await wrapper.get('#contest-add-problem').setValue(code);
      await wrapper.get('#contest-add-problem').trigger('keydown', { key: 'Enter' });
      await flushPromises();
    }
    expect(wrapper.text()).toContain('Bài hcmus41a đã có trong kỳ thi.');
    expect(wrapper.findAll('tbody tr')).toHaveLength(3);
  });

  it('shows the output-cut and cap columns on request, and on their own once a problem has a cap', async () => {
    const uncapped = editableContest();
    uncapped.problems = uncapped.problems!.map((problem) => ({ ...problem, maxSubmissions: null }));
    mockApi({ ...staffViewer(EDIT), ...contestEditorRoutes(uncapped) });
    const plain = await mountAndWaitFor('/admin/contests/hcmus-w41/problems', WARNING);
    const capBoxes = () => plain.wrapper.findAll('input[aria-label^="Số lần nộp tối đa cho"]');
    expect(capBoxes()).toHaveLength(0);
    await plain.wrapper.get('[data-testid="contest-limits-toggle"]').trigger('click');
    expect(capBoxes()).toHaveLength(3);
    plain.wrapper.unmount();

    mockApi({ ...staffViewer(EDIT), ...contestEditorRoutes() });
    const { wrapper } = await mountAndWaitFor('/admin/contests/hcmus-w41/problems', WARNING);
    const cap = wrapper.get('input[aria-label="Số lần nộp tối đa cho hcmus41c"]');
    expect((cap.element as HTMLInputElement).value).toBe('20');
    await cap.setValue('');
    expect(wrapper.find('input[aria-label="Số lần nộp tối đa cho hcmus41c"]').exists()).toBe(true);
  });

  it('refuses a cleared points box beside its row, and sends nothing', async () => {
    const calls = mockApi({
      ...staffViewer(EDIT),
      ...contestEditorRoutes(),
      'PATCH /contests/hcmus-w41': ok(editableContest()),
    });
    const { wrapper } = await mountAndWaitFor('/admin/contests/hcmus-w41/problems', WARNING);
    await wrapper.get('input[aria-label="Điểm của hcmus41a"]').setValue('');
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Lưu bài trong kỳ thi')!
      .trigger('click');
    await flushPromises();
    expect(calls.some((call) => call.method === 'PATCH')).toBe(false);
    expect(wrapper.text()).toContain('Điểm từ 0 đến 3500, là số nguyên.');
  });

  it("sets points on the ticked rows, moves a row by position and copies another contest's problems", async () => {
    const calls = mockApi({
      ...staffViewer(EDIT),
      ...contestEditorRoutes(),
      'GET /contests/hcmus-w40': ok(
        editableContest({
          key: 'hcmus-w40',
          problems: [
            contestProblem('A', 'hcmus41a', 'Dãy số đẹp'),
            contestProblem('D', 'hcmus40d', 'Cây khung', { points: 300 }),
          ],
        }),
      ),
      'PATCH /contests/hcmus-w41': ok(editableContest()),
    });
    const { wrapper } = await mountAndWaitFor('/admin/contests/hcmus-w41/problems', WARNING);
    const boxes = wrapper.findAll('tbody input[type="checkbox"][aria-label^="Chọn"]');
    await boxes[0]!.setValue(true);
    await boxes[2]!.setValue(true);
    await wrapper.get('#contest-bulk-points').setValue('250');
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Đặt điểm')!
      .trigger('click');
    const position = wrapper.get('input[aria-label="Vị trí của hcmus41c"]');
    await position.setValue('1');
    await position.trigger('change');
    expect(wrapper.get('#contest-copy-problems').isVisible()).toBe(false);
    await wrapper.get('[data-testid="contest-copy-toggle"]').trigger('click');
    await wrapper.get('#contest-copy-problems').setValue('hcmus-w40');
    await wrapper
      .findAll('form')
      .find((form) => form.find('#contest-copy-problems').exists())!
      .trigger('submit');
    await flushPromises();
    expect(wrapper.text()).toContain('Đã thêm 1 bài từ hcmus-w40 (bỏ qua 1)');
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Lưu bài trong kỳ thi')!
      .trigger('click');
    await flushPromises();
    const body = calls.find((call) => call.method === 'PATCH')!.body as {
      problems: { problem: string; points: number }[];
    };
    const [first, second, third] = editableContest().problems!.map((problem) => problem.problemId);
    expect(body.problems.map((row) => [row.problem, row.points])).toEqual([
      [third, 250],
      [first, 250],
      [second, editableContest().problems![1]!.points],
      [contestProblem('D', 'hcmus40d', 'Cây khung').problemId, 300],
    ]);
  });
});
