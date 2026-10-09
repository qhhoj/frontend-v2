import { describe, expect, it } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { fail, mockApi, ok } from '@/test/mock-api';
import { staffViewer } from '@/test/admin-routes';
import {
  contestEditorRoutes,
  contestSettings,
  editableContest,
} from '@/test/admin-fixtures/contests';
import { mountAndWaitFor } from '../contest-spec-helpers';

const EDIT = ['judge.edit_own_contest'];
const WARNING = 'Đổi điểm hoặc cách tính khi kỳ thi đã có bài nộp không tự tính lại.';

describe('ContestProblemsTab', () => {
  it('adds a problem by code under the next label and saves the whole list', async () => {
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
    const { wrapper } = await mountAndWaitFor('/admin/contests/hcmus-w41/problems', WARNING);
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

  it('shows a stored output prefix in its row and saves it back untouched', async () => {
    const contest = editableContest();
    const stored = editableContest({
      settings: contestSettings({
        problemOutputPrefixes: [
          { problemId: contest.problems![2]!.problemId, outputPrefixOverride: 4096 },
        ],
      }),
    });
    const calls = mockApi({
      ...staffViewer(EDIT),
      ...contestEditorRoutes(stored),
      'PATCH /contests/hcmus-w41': ok(stored),
    });
    const { wrapper } = await mountAndWaitFor('/admin/contests/hcmus-w41/problems', WARNING);
    expect(
      (wrapper.get('input[aria-label="Cắt output cho hcmus41c"]').element as HTMLInputElement)
        .value,
    ).toBe('4096');
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Lưu bài trong kỳ thi')!
      .trigger('click');
    await flushPromises();
    const body = calls.find((call) => call.method === 'PATCH')!.body as {
      problems: { outputPrefixOverride?: number }[];
    };
    expect(body.problems.map((row) => row.outputPrefixOverride)).toEqual([
      undefined,
      undefined,
      4096,
    ]);
  });

  it('warns that changed points are not rescored', async () => {
    mockApi({ ...staffViewer(EDIT), ...contestEditorRoutes() });
    const { wrapper } = await mountAndWaitFor('/admin/contests/hcmus-w41/problems', WARNING);
    expect(wrapper.text()).toContain(
      'Đổi điểm hoặc cách tính khi kỳ thi đã có bài nộp không tự tính lại.',
    );
  });

  it('moves a row up with its labelled button', async () => {
    mockApi({ ...staffViewer(EDIT), ...contestEditorRoutes() });
    const { wrapper } = await mountAndWaitFor('/admin/contests/hcmus-w41/problems', WARNING);
    await wrapper.get('button[aria-label="Chuyển hcmus41c lên"]').trigger('click');
    expect(
      wrapper.findAll('tbody tr').map((row) => row.find('[data-testid="code"]').text()),
    ).toEqual(['hcmus41a', 'hcmus41c', 'hcmus41b']);
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
});
