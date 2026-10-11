import { flushPromises } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { mountAndWaitFor } from '@/test/admin-contest-mount';
import {
  contestActions,
  contestDataStatus,
  contestEditorRoutes,
  editableContest,
} from '@/test/admin-fixtures/contests';
import { confirmDialog, openDialog, staffViewer } from '@/test/admin-routes';
import { publishedProblem, publishResult } from '@/test/contest-extras-fixtures';
import { mockApi, ok } from '@/test/mock-api';

const ended = editableContest({ phase: 'ended' });
const PATH = '/admin/contests/hcmus-w41/actions';
const TITLE = 'Công khai bài sau kỳ thi';
const PUBLISH = '/contests/hcmus-w41/publish-problems';
const routes = (extra = {}, contest = ended) => ({
  ...staffViewer(['judge.edit_own_contest']),
  ...contestEditorRoutes(contest),
  'GET /contests/hcmus-w41/data': ok(contestDataStatus()),
  'GET /contests/hcmus-w41/actions': ok(contestActions()),
  ...extra,
});
const items = [
  publishedProblem({ problemId: 'a', code: 'hcmus41a', editorial: 'published' }),
  publishedProblem({
    problemId: 'b',
    code: null,
    outcome: 'skipped',
    reason: 'organization_private',
  }),
];
const answerPublish = (call: { body?: unknown }) =>
  ok(publishResult(items, (call.body as { dryRun: boolean }).dryRun));

type Mounted = Awaited<ReturnType<typeof mountAndWaitFor>>['wrapper'];
const card = (wrapper: Mounted) => wrapper.get('[data-testid="publish-card"]');
const buttonOf = (wrapper: Mounted, text: string) =>
  card(wrapper)
    .findAll('button')
    .find((button) => button.text() === text)!;
const press = async (wrapper: Mounted, text: string) => {
  await buttonOf(wrapper, text).trigger('click');
  await flushPromises();
};
const publishBodies = (calls: ReturnType<typeof mockApi>) =>
  calls.filter((call) => call.path === PUBLISH).map((call) => call.body);

describe('publish card', () => {
  it('lists the dry run per problem, then publishes the same choice only after the confirm', async () => {
    const calls = mockApi(routes({ [`POST ${PUBLISH}`]: answerPublish }));
    const { wrapper } = await mountAndWaitFor(PATH, TITLE);
    expect(buttonOf(wrapper, 'Công khai').attributes('aria-disabled')).toBe('true');
    await press(wrapper, 'Công khai');
    expect(publishBodies(calls)).toEqual([]);
    await press(wrapper, 'Chạy thử');
    expect(card(wrapper).findAll('[data-testid="publish-row"]')).toHaveLength(2);
    expect(card(wrapper).text()).toContain('Sẽ công khai 1 bài, giữ nguyên 0, bỏ qua 1.');
    expect(card(wrapper).text()).toContain('Bài riêng của tổ chức.');
    expect(card(wrapper).text()).toContain('(bài riêng)');
    await press(wrapper, 'Công khai');
    expect(openDialog().textContent).toContain('1 bài sẽ ra kho bài công khai');
    await confirmDialog('Công khai');
    expect(publishBodies(calls)).toEqual([
      { editorials: true, dryRun: true },
      { editorials: true, dryRun: false },
    ]);
    expect(card(wrapper).text()).toContain('Đã công khai 1 bài, bỏ qua 1.');
    expect(buttonOf(wrapper, 'Công khai').attributes('aria-disabled')).toBe('true');
  });

  it('asks for a new dry run when the editorial choice changes', async () => {
    mockApi(routes({ [`POST ${PUBLISH}`]: answerPublish }));
    const { wrapper } = await mountAndWaitFor(PATH, TITLE);
    await press(wrapper, 'Chạy thử');
    expect(buttonOf(wrapper, 'Công khai').attributes('aria-disabled')).toBeUndefined();
    await card(wrapper).get('input[type="checkbox"]').setValue(false);
    expect(buttonOf(wrapper, 'Công khai').attributes('aria-disabled')).toBe('true');
  });

  it.each([
    ['no_permission', 'người bật tính năng không còn quyền công khai'],
    ['brand_new_reason', 'lý do không rõ'],
  ])('shows a failed automatic run (%s) as text, never as the code', async (reason, text) => {
    const autoPublish = {
      at: '2026-10-08T10:00:00.000Z',
      status: 'failed',
      reason,
      published: 0,
      skipped: 0,
    } as const;
    mockApi(routes({ 'GET /contests/hcmus-w41/actions': ok(contestActions({ autoPublish })) }));
    const { wrapper } = await mountAndWaitFor(PATH, TITLE);
    expect(card(wrapper).text()).toContain(`không chạy: ${text}`);
    expect(card(wrapper).text()).not.toContain(reason);
  });
});
