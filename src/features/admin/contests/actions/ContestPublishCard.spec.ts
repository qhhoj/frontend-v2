import { flushPromises } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { mountAndWaitFor } from '@/test/admin-contest-mount';
import {
  contestActions,
  contestDataStatus,
  contestEditorRoutes,
  contestSettings,
  editableContest,
} from '@/test/admin-fixtures/contests';
import { confirmDialog, openDialog, staffViewer, switchNamed } from '@/test/admin-routes';
import { publishedProblem, publishResult } from '@/test/contest-extras-fixtures';
import { fail, mockApi, ok, rateLimited } from '@/test/mock-api';

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

  it('offers no run before the contest has ended', async () => {
    mockApi(routes({}, editableContest({ phase: 'running' })));
    const { wrapper } = await mountAndWaitFor(PATH, TITLE);
    expect(card(wrapper).text()).toContain('Chỉ công khai được sau khi kỳ thi kết thúc.');
    expect(
      card(wrapper)
        .findAll('button')
        .some((button) => button.text() === 'Chạy thử'),
    ).toBe(false);
  });

  it('turns a contest_not_ended refusal and the rate limit into text', async () => {
    mockApi(routes({ [`POST ${PUBLISH}`]: fail(409, 'contest_not_ended') }));
    const first = await mountAndWaitFor(PATH, TITLE);
    await press(first.wrapper, 'Chạy thử');
    expect(card(first.wrapper).get('[role="alert"]').text()).toContain('Kỳ thi chưa kết thúc.');
    first.wrapper.unmount();
    mockApi(routes({ [`POST ${PUBLISH}`]: rateLimited(1800) }));
    const second = await mountAndWaitFor(PATH, TITLE);
    await press(second.wrapper, 'Chạy thử');
    expect(card(second.wrapper).get('[role="alert"]').text()).toContain('Bạn thao tác quá nhanh');
    expect(card(second.wrapper).text()).toContain('1800');
  });

  it.each([
    ['no_permission', 'người bật tính năng không còn quyền công khai'],
    ['cannot_edit_contest', 'người bật tính năng không còn quyền sửa kỳ thi'],
    ['actor_unavailable', 'người bật tính năng không còn dùng được tài khoản'],
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

  it('shows a done automatic run and a scheduled one', async () => {
    const autoPublish = {
      at: '2026-10-08T10:00:00.000Z',
      status: 'published',
      reason: '',
      published: 3,
      skipped: 1,
    } as const;
    mockApi(
      routes({
        'GET /contests/hcmus-w41/actions': ok(contestActions({ autoPublish, publish: 'queued' })),
      }),
    );
    const { wrapper } = await mountAndWaitFor(PATH, TITLE);
    expect(card(wrapper).text()).toContain('3 bài, bỏ qua 1');
    expect(card(wrapper).text()).toContain('Đã hẹn tự công khai');
  });

  it('saves the auto-publish switch at once', async () => {
    const saved = editableContest({
      phase: 'ended',
      settings: contestSettings({ publishAfterEnd: true }),
    });
    const calls = mockApi(routes({ 'PATCH /contests/hcmus-w41': ok(saved) }));
    const { wrapper } = await mountAndWaitFor(PATH, TITLE);
    const toggle = switchNamed(card(wrapper), 'Tự công khai khi kỳ thi kết thúc');
    expect(toggle.attributes('aria-checked')).toBe('false');
    await toggle.trigger('click');
    await flushPromises();
    expect(calls.filter((call) => call.method === 'PATCH').map((call) => call.body)).toEqual([
      { publishAfterEnd: true },
    ]);
  });
});
