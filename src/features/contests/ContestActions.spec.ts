import { flushPromises } from '@vue/test-utils';
import { nextTick } from 'vue';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { contestDetail, contestViewer, participationSummary } from '@/test/fixtures';
import { contestPageRoutes } from '@/test/contest-routes';
import { fail, mockApi, ok, page, sequence } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { signedInViewer } from '@/test/problem-routes';
import { RULES_HTML, RULES_MARKDOWN } from '@/test/contest-extras-fixtures';

const NOW = Date.parse('2026-10-08T09:37:07Z');
const actionsOf = (wrapper: Awaited<ReturnType<typeof mountApp>>['wrapper']) =>
  wrapper.get('[data-testid="contest-actions"]');
const buttonNamed = (wrapper: Awaited<ReturnType<typeof mountApp>>['wrapper'], name: string) =>
  actionsOf(wrapper)
    .findAll('button')
    .find((button) => button.text().startsWith(name))!;
const cancelButton = () =>
  [...dialog()!.querySelectorAll('button')].find((button) => button.textContent?.trim() === 'Hủy')!;
const typeCode = async (code: string) => {
  const input = dialog()!.querySelector<HTMLInputElement>('input')!;
  input.value = code;
  input.dispatchEvent(new Event('input'));
  await flushPromises();
};
const dialog = () => document.body.querySelector<HTMLElement>('[role="dialog"]');

describe('contest actions', () => {
  afterEach(() => vi.useRealTimers());

  it('keeps a wrong access code inside the dialog with the sweating Bit, then joins with the right one', async () => {
    vi.useFakeTimers({ now: NOW, toFake: ['Date'] });
    const coded = contestDetail({ requiresAccessCode: true });
    const calls = mockApi({
      ...signedInViewer(),
      ...contestPageRoutes(coded),
      'POST /contests/r42/join': sequence(fail(403, 'forbidden'), ok(participationSummary())),
    });
    const { wrapper } = await mountApp('/contests/r42');
    await buttonNamed(wrapper, 'Vào thi').trigger('click');
    await flushPromises();
    const input = dialog()!.querySelector<HTMLInputElement>('input')!;
    expect(document.activeElement).toBe(input);
    input.value = 'wrong';
    input.dispatchEvent(new Event('input'));
    await flushPromises();
    dialog()!.querySelector('form')!.dispatchEvent(new Event('submit'));
    await flushPromises();
    expect(dialog()!.querySelector('[role="alert"]')!.textContent).not.toBe('');
    expect(dialog()!.querySelector('[role="alert"] [aria-hidden="true"]')).not.toBeNull();
    input.value = 'opensesame';
    input.dispatchEvent(new Event('input'));
    await flushPromises();
    dialog()!.querySelector('form')!.dispatchEvent(new Event('submit'));
    await flushPromises();
    expect(
      calls.filter((call) => call.path === '/contests/r42/join').map((call) => call.body),
    ).toEqual([{ accessCode: 'wrong' }, { accessCode: 'opensesame' }]);
    await vi.waitFor(() => expect(dialog()).toBeNull());
    expect(document.activeElement).toBe(actionsOf(wrapper).element);
  });
});

const joinCalls = (calls: ReturnType<typeof mockApi>) =>
  calls.filter((call) => call.path === '/contests/r42/join');

describe('contest actions: access codes, busy state and the spectator path', () => {
  afterEach(() => vi.useRealTimers());

  it('asks a tester for the code on a coded contest', async () => {
    vi.useFakeTimers({ now: NOW, toFake: ['Date'] });
    const calls = mockApi({
      ...signedInViewer(),
      ...contestPageRoutes(
        contestDetail({ requiresAccessCode: true, viewer: contestViewer({ isTester: true }) }),
      ),
    });
    const { wrapper } = await mountApp('/contests/r42');
    await buttonNamed(wrapper, 'Theo dõi').trigger('click');
    await flushPromises();
    expect(dialog()).not.toBeNull();
    expect(joinCalls(calls)).toHaveLength(0);
  });

  it('lets an editor who may edit the contest in without the code', async () => {
    vi.useFakeTimers({ now: NOW, toFake: ['Date'] });
    const calls = mockApi({
      ...signedInViewer(),
      ...contestPageRoutes(
        contestDetail({
          requiresAccessCode: true,
          viewer: contestViewer({ isEditor: true, canEdit: true }),
        }),
      ),
      'POST /contests/r42/join': ok(participationSummary()),
    });
    const { wrapper } = await mountApp('/contests/r42');
    await buttonNamed(wrapper, 'Theo dõi').trigger('click');
    await flushPromises();
    expect(dialog()).toBeNull();
    expect(joinCalls(calls).map((call) => call.body)).toEqual([{}]);
  });

  it('continues a finished participation as a spectator without the code', async () => {
    vi.useFakeTimers({ now: NOW, toFake: ['Date'] });
    const finished = contestDetail({
      requiresAccessCode: true,
      viewer: contestViewer({
        liveStatus: 'finished',
        liveParticipation: participationSummary({ endTime: '2026-10-08T09:00:00Z' }),
      }),
    });
    const calls = mockApi({
      ...signedInViewer(),
      ...contestPageRoutes(finished),
      'POST /contests/r42/join': ok(participationSummary({ virtual: -1 })),
    });
    const { wrapper } = await mountApp('/contests/r42');
    expect(actionsOf(wrapper).text()).toContain('Bạn đã hết giờ làm bài.');
    await buttonNamed(wrapper, 'Xem tiếp ở chế độ theo dõi').trigger('click');
    await flushPromises();
    expect(dialog()).toBeNull();
    expect(joinCalls(calls).map((call) => call.body)).toEqual([{}]);
  });

  it('drops the code from the mutation cache once the dialog is done with it', async () => {
    vi.useFakeTimers({ now: NOW, toFake: ['Date'] });
    mockApi({
      ...signedInViewer(),
      ...contestPageRoutes(contestDetail({ requiresAccessCode: true })),
      'POST /contests/r42/join': ok(participationSummary()),
    });
    const { wrapper, queryClient } = await mountApp('/contests/r42');
    await buttonNamed(wrapper, 'Vào thi').trigger('click');
    await flushPromises();
    const input = dialog()!.querySelector<HTMLInputElement>('input')!;
    input.value = 'opensesame';
    input.dispatchEvent(new Event('input'));
    await flushPromises();
    dialog()!.querySelector('form')!.dispatchEvent(new Event('submit'));
    await flushPromises();
    const cachedCodes = () =>
      queryClient
        .getMutationCache()
        .getAll()
        .filter(
          (mutation) =>
            (mutation.state.variables as { accessCode?: string } | undefined)?.accessCode,
        );
    await vi.waitFor(() => expect(cachedCodes()).toHaveLength(0));
  });

  it('forgets a wrong-code error when the dialog is cancelled', async () => {
    vi.useFakeTimers({ now: NOW, toFake: ['Date'] });
    mockApi({
      ...signedInViewer(),
      ...contestPageRoutes(contestDetail({ requiresAccessCode: true })),
      'POST /contests/r42/join': fail(403, 'wrong_access_code'),
    });
    const { wrapper } = await mountApp('/contests/r42');
    await buttonNamed(wrapper, 'Vào thi').trigger('click');
    await flushPromises();
    await typeCode('wrong');
    dialog()!.querySelector('form')!.dispatchEvent(new Event('submit'));
    await flushPromises();
    expect(dialog()!.querySelector('[role="alert"]')).not.toBeNull();
    cancelButton().click();
    await vi.waitFor(() => expect(dialog()).toBeNull());
    expect(actionsOf(wrapper).find('[role="alert"]').exists()).toBe(false);
  });

  it('sends one join for a double press and marks the button busy while it runs', async () => {
    vi.useFakeTimers({ now: NOW, toFake: ['Date'] });
    const calls = mockApi({
      ...signedInViewer(),
      ...contestPageRoutes(),
      'POST /contests/r42/join': ok(participationSummary()),
    });
    const { wrapper } = await mountApp('/contests/r42');
    const button = buttonNamed(wrapper, 'Vào thi');
    button.element.click();
    button.element.click();
    await nextTick();
    expect(button.element.getAttribute('aria-busy')).toBe('true');
    await flushPromises();
    expect(joinCalls(calls)).toHaveLength(1);
  });
});

describe('contest refusals', () => {
  afterEach(() => vi.useRealTimers());

  it('opens the code dialog when the backend asks for a code the page did not know about', async () => {
    vi.useFakeTimers({ now: NOW, toFake: ['Date'] });
    mockApi({
      ...signedInViewer(),
      ...contestPageRoutes(),
      'POST /contests/r42/join': fail(403, 'access_code_required'),
    });
    const { wrapper } = await mountApp('/contests/r42');
    await buttonNamed(wrapper, 'Vào thi').trigger('click');
    await flushPromises();
    expect(dialog()).not.toBeNull();
    expect(dialog()!.querySelector('[role="alert"]')).toBeNull();
  });
});

describe('contest actions with rules', () => {
  afterEach(() => vi.useRealTimers());
  const ruled = (overrides: Parameters<typeof contestDetail>[0] = {}) =>
    contestDetail({ rules: RULES_MARKDOWN, rulesHtml: RULES_HTML, rulesRevision: 3, ...overrides });
  const tickAndConfirm = async () => {
    dialog()!.querySelector<HTMLInputElement>('input[type="checkbox"]')!.click();
    await flushPromises();
    dialog()!.querySelector('form')!.dispatchEvent(new Event('submit'));
    await flushPromises();
  };
  const joinBodies = (calls: ReturnType<typeof mockApi>) =>
    calls.filter((call) => call.path === '/contests/r42/join').map((call) => call.body);

  it('asks for the rules before a first live join and sends the acceptance', async () => {
    vi.useFakeTimers({ now: NOW, toFake: ['Date'] });
    const calls = mockApi({
      ...signedInViewer(),
      ...contestPageRoutes(ruled()),
      'POST /contests/r42/join': ok(participationSummary()),
    });
    const { wrapper } = await mountApp('/contests/r42');
    await buttonNamed(wrapper, 'Vào thi').trigger('click');
    await flushPromises();
    expect(joinBodies(calls)).toEqual([]);
    expect(dialog()!.textContent).toContain('Quy định kỳ thi');
    await tickAndConfirm();
    expect(joinBodies(calls)).toEqual([{ acceptRules: true, acceptRulesRevision: 3 }]);
  });

  it('asks again for every virtual run', async () => {
    const calls = mockApi({
      ...signedInViewer(),
      ...contestPageRoutes(
        ruled({ phase: 'ended', viewer: contestViewer({ liveStatus: 'finished' }) }),
      ),
      'POST /contests/r42/join': ok(participationSummary({ virtual: 2 })),
    });
    const { wrapper } = await mountApp('/contests/r42');
    await buttonNamed(wrapper, 'Bắt đầu thi ảo').trigger('click');
    await flushPromises();
    expect(dialog()!.textContent).toContain('Mỗi lượt thi ảo cần đồng ý lại');
    await tickAndConfirm();
    expect(joinBodies(calls)).toEqual([{ acceptRules: true, acceptRulesRevision: 3 }]);
  });

  it('asks nothing of a registered contestant who joins, nor when the rules are blank', async () => {
    vi.useFakeTimers({ now: NOW, toFake: ['Date'] });
    const calls = mockApi({
      ...signedInViewer(),
      ...contestPageRoutes(ruled({ viewer: contestViewer({ liveStatus: 'registered' }) })),
      'POST /contests/r42/join': ok(participationSummary()),
    });
    const { wrapper } = await mountApp('/contests/r42');
    await buttonNamed(wrapper, 'Vào thi').trigger('click');
    await flushPromises();
    expect(dialog()).toBeNull();
    expect(joinBodies(calls)).toEqual([{}]);
    wrapper.unmount();
    const second = mockApi({
      ...signedInViewer(),
      ...contestPageRoutes(contestDetail({ rules: '   ' })),
      'POST /contests/r42/join': ok(participationSummary()),
    });
    const mounted = await mountApp('/contests/r42');
    await buttonNamed(mounted.wrapper, 'Vào thi').trigger('click');
    await flushPromises();
    expect(joinBodies(second)).toEqual([{}]);
  });

  it('asks the rules first, then the code, and sends both in one request', async () => {
    vi.useFakeTimers({ now: NOW, toFake: ['Date'] });
    const calls = mockApi({
      ...signedInViewer(),
      ...contestPageRoutes(ruled({ requiresAccessCode: true })),
      'POST /contests/r42/join': ok(participationSummary()),
    });
    const { wrapper } = await mountApp('/contests/r42');
    await buttonNamed(wrapper, 'Vào thi').trigger('click');
    await flushPromises();
    await tickAndConfirm();
    // The rules dialog leaves before the code dialog is the only one: `dialog()` must find the code dialog.
    await vi.waitFor(() =>
      expect(document.body.querySelectorAll('[role="dialog"]')).toHaveLength(1),
    );
    await typeCode('opensesame');
    dialog()!.querySelector('form')!.dispatchEvent(new Event('submit'));
    await flushPromises();
    expect(joinBodies(calls)).toEqual([
      { accessCode: 'opensesame', acceptRules: true, acceptRulesRevision: 3 },
    ]);
  });

  it('opens the rules when the server refuses for rules the page did not know, and re-reads the contest', async () => {
    vi.useFakeTimers({ now: NOW, toFake: ['Date'] });
    const calls = mockApi({
      ...signedInViewer(),
      ...contestPageRoutes(),
      'GET /contests/r42': sequence(ok(contestDetail()), ok(ruled())),
      'POST /contests/r42/join': sequence(
        fail(400, 'rules_not_accepted'),
        ok(participationSummary()),
      ),
    });
    const { wrapper } = await mountApp('/contests/r42');
    await buttonNamed(wrapper, 'Vào thi').trigger('click');
    await flushPromises();
    expect(dialog()!.textContent).toContain('Thể lệ vừa được cập nhật, vui lòng đọc lại');
    expect(
      calls.filter((call) => call.path === '/contests/r42' && call.method === 'GET').length,
    ).toBeGreaterThanOrEqual(2);
    await tickAndConfirm();
    expect(joinBodies(calls)).toEqual([{}, { acceptRules: true, acceptRulesRevision: 3 }]);
  });

  it('keeps the rules open with a notice when they changed, then sends the new revision', async () => {
    vi.useFakeTimers({ now: NOW, toFake: ['Date'] });
    const calls = mockApi({
      ...signedInViewer(),
      ...contestPageRoutes(),
      'GET /contests/r42': sequence(ok(ruled()), ok(ruled({ rulesRevision: 4 }))),
      'POST /contests/r42/join': sequence(fail(409, 'rules_changed'), ok(participationSummary())),
    });
    const { wrapper } = await mountApp('/contests/r42');
    await buttonNamed(wrapper, 'Vào thi').trigger('click');
    await flushPromises();
    await tickAndConfirm();
    expect(dialog()!.textContent).toContain('Thể lệ vừa được cập nhật, vui lòng đọc lại');
    await tickAndConfirm();
    expect(joinBodies(calls)).toEqual([
      { acceptRules: true, acceptRulesRevision: 3 },
      { acceptRules: true, acceptRulesRevision: 4 },
    ]);
  });
});

describe('contest actions: a virtual run of another contest', () => {
  const otherRun = {
    contest: {
      key: 'trash_ended',
      name: 'Trash Cup 2026',
      startTime: '2026-09-26T04:40:00Z',
      endTime: '2026-09-26T07:40:00Z',
    },
    participation: participationSummary({ virtual: 1, endTime: '2999-01-01T00:00:00Z' }),
  };
  const routes = () => ({
    ...signedInViewer(),
    ...contestPageRoutes(),
    'GET /contests/current': ok(otherRun),
    'GET /contests/trash_ended/announcements': page([]),
    'POST /contests/r42/join': ok(participationSummary()),
  });
  afterEach(() => vi.useRealTimers());
  const dialogButton = (name: string) =>
    [...dialog()!.querySelectorAll('button')].find(
      (button) => button.textContent?.trim() === name,
    )!;

  it('asks before joining ends it, and stays when the viewer keeps the run', async () => {
    vi.useFakeTimers({ now: NOW, toFake: ['Date'] });
    const calls = mockApi(routes());
    const { wrapper } = await mountApp('/contests/r42');
    await vi.waitFor(() => expect(wrapper.find('[data-testid="contest-bar"]').exists()).toBe(true));
    await buttonNamed(wrapper, 'Vào thi').trigger('click');
    await flushPromises();
    expect(dialog()!.textContent).toContain('Trash Cup 2026');
    dialogButton('Ở lại lượt ảo').click();
    await flushPromises();
    expect(joinCalls(calls)).toEqual([]);
  });

  it('joins once the viewer confirms', async () => {
    vi.useFakeTimers({ now: NOW, toFake: ['Date'] });
    const calls = mockApi(routes());
    const { wrapper } = await mountApp('/contests/r42');
    await vi.waitFor(() => expect(wrapper.find('[data-testid="contest-bar"]').exists()).toBe(true));
    await buttonNamed(wrapper, 'Vào thi').trigger('click');
    await flushPromises();
    dialogButton('Vào thi').click();
    await flushPromises();
    expect(joinCalls(calls)).toHaveLength(1);
  });
});

describe('contest actions: leaving', () => {
  const inContest = (overrides: Parameters<typeof contestDetail>[0] = {}) =>
    contestDetail({
      viewer: contestViewer({ isCurrent: true, inContest: true, liveStatus: 'participating' }),
      ...overrides,
    });
  const leaveCalls = (calls: ReturnType<typeof mockApi>) =>
    calls.filter((call) => call.path === '/contests/r42/leave');
  const link = (wrapper: Awaited<ReturnType<typeof mountApp>>['wrapper'], name: string) =>
    actionsOf(wrapper)
      .findAll('button')
      .find((button) => button.text() === name);
  afterEach(() => vi.useRealTimers());

  it('asks before leaving a live contest, then leaves on confirm', async () => {
    vi.useFakeTimers({ now: NOW, toFake: ['Date'] });
    const detail = inContest();
    const calls = mockApi({
      ...signedInViewer(),
      ...contestPageRoutes(detail),
      'GET /contests/current': ok({ contest: detail, participation: participationSummary() }),
      'POST /contests/r42/leave': ok(null),
    });
    const { wrapper } = await mountApp('/contests/r42');
    await vi.waitFor(() => expect(link(wrapper, 'Rời kỳ thi')).toBeDefined());
    await link(wrapper, 'Rời kỳ thi')!.trigger('click');
    await flushPromises();
    expect(dialog()!.textContent).toContain('Rời kỳ thi?');
    expect(leaveCalls(calls)).toEqual([]);
    dialog()!.querySelector('form')!.dispatchEvent(new Event('submit'));
    await flushPromises();
    expect(leaveCalls(calls)).toHaveLength(1);
  });

  it('words an ended contest as a virtual run even before the current participation answers', async () => {
    vi.useFakeTimers({ now: NOW, toFake: ['Date'] });
    mockApi({
      ...signedInViewer(),
      ...contestPageRoutes(
        inContest({
          phase: 'ended',
          startTime: '2026-10-01T08:00:00Z',
          endTime: '2026-10-01T11:00:00Z',
        }),
      ),
      'GET /contests/current': fail(500, 'internal'),
    });
    const { wrapper } = await mountApp('/contests/r42');
    await vi.waitFor(() => expect(link(wrapper, 'Dừng lượt ảo')).toBeDefined());
    expect(link(wrapper, 'Rời kỳ thi')).toBeUndefined();
  });
});
