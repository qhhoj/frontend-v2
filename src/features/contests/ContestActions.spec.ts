import { flushPromises } from '@vue/test-utils';
import { nextTick } from 'vue';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/api/client';
import { errorMessageKey } from '@/i18n/error-message';
import { contestDetail, contestViewer, participationSummary } from '@/test/fixtures';
import { contestPageRoutes } from '@/test/contest-routes';
import { fail, mockApi, noContent, ok, sequence } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { anonymousViewer, signedInViewer } from '@/test/problem-routes';
import { RULES_HTML, RULES_MARKDOWN } from '@/test/contest-extras-fixtures';
import { PARTICIPATION_REFUSALS } from './participation-refusal';

const NOW = Date.parse('2026-10-08T09:37:07Z');
const BEFORE_START = Date.parse('2026-10-08T07:59:58Z');
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

  it('asks a visitor to sign in and come back', async () => {
    mockApi({ ...anonymousViewer, ...contestPageRoutes() });
    const { wrapper } = await mountApp('/contests/r42');
    expect(actionsOf(wrapper).get('a').attributes('href')).toBe('/login?redirect=/contests/r42');
  });

  it('joins a running contest, reloads it and says so once', async () => {
    vi.useFakeTimers({ now: NOW, toFake: ['Date'] });
    const joined = contestDetail({
      viewer: contestViewer({
        inContest: true,
        isCurrent: true,
        liveStatus: 'participating',
        liveParticipation: participationSummary(),
      }),
    });
    const calls = mockApi({
      ...signedInViewer(),
      ...contestPageRoutes(),
      'GET /contests/r42': sequence(ok(contestDetail()), ok(joined)),
      'POST /contests/r42/join': ok(participationSummary()),
      'GET /contests/current': ok({
        contest: { key: 'r42', name: 'x', startTime: joined.startTime, endTime: joined.endTime },
        participation: participationSummary(),
      }),
    });
    const { wrapper } = await mountApp('/contests/r42');
    await buttonNamed(wrapper, 'Vào thi').trigger('click');
    await flushPromises();
    expect(calls.find((call) => call.path === '/contests/r42/join')!.body).toEqual({});
    expect(actionsOf(wrapper).text()).toContain('Bạn đang thi');
    expect(wrapper.get('[data-testid="participation-status"]').text()).toBe('Bạn đã vào kỳ thi.');
  });

  it('leaves the current contest and explains that the score stays', async () => {
    vi.useFakeTimers({ now: NOW, toFake: ['Date'] });
    const inside = contestDetail({
      viewer: contestViewer({
        inContest: true,
        isCurrent: true,
        liveStatus: 'participating',
        liveParticipation: participationSummary(),
      }),
    });
    const calls = mockApi({
      ...signedInViewer(),
      ...contestPageRoutes(inside),
      'GET /contests/current': ok({
        contest: { key: 'r42', name: 'x', startTime: inside.startTime, endTime: inside.endTime },
        participation: participationSummary(),
      }),
      'POST /contests/r42/leave': noContent(),
    });
    const { wrapper } = await mountApp('/contests/r42');
    expect(actionsOf(wrapper).text()).toContain('Điểm giữ nguyên');
    await buttonNamed(wrapper, 'Rời kỳ thi').trigger('click');
    await flushPromises();
    expect(calls.some((call) => call.path === '/contests/r42/leave')).toBe(true);
  });

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

  it('clears a typed access code when the dialog is closed', async () => {
    vi.useFakeTimers({ now: NOW, toFake: ['Date'] });
    mockApi({
      ...signedInViewer(),
      ...contestPageRoutes(contestDetail({ requiresAccessCode: true })),
    });
    const { wrapper } = await mountApp('/contests/r42');
    await buttonNamed(wrapper, 'Vào thi').trigger('click');
    await flushPromises();
    const input = dialog()!.querySelector<HTMLInputElement>('input')!;
    input.value = 'typed-then-closed';
    input.dispatchEvent(new Event('input'));
    await flushPromises();
    cancelButton().click();
    await flushPromises();
    await buttonNamed(wrapper, 'Vào thi').trigger('click');
    await flushPromises();
    expect(dialog()!.querySelector<HTMLInputElement>('input')!.value).toBe('');
  });

  it('tells a registered contestant when the contest opens and keeps join disabled until then', async () => {
    vi.useFakeTimers({ now: Date.parse('2026-10-08T07:17:45Z'), toFake: ['Date'] });
    vi.stubEnv('TZ', 'UTC');
    const registered = contestDetail({
      phase: 'upcoming',
      registrationEnd: '2026-10-08T07:30:00Z',
      viewer: contestViewer({
        liveStatus: 'registered',
        liveParticipation: participationSummary({ isRegistered: true }),
      }),
    });
    mockApi({ ...signedInViewer(), ...contestPageRoutes(registered) });
    const { wrapper } = await mountApp('/contests/r42');
    expect(actionsOf(wrapper).text()).toContain('Bạn đã đăng ký');
    expect(buttonNamed(wrapper, 'Vào thi').attributes('aria-disabled')).toBe('true');
    expect(buttonNamed(wrapper, 'Vào thi').text()).toContain('mở lúc 08:00');
    vi.unstubAllEnvs();
  });

  it('offers join once the contest has started, though the server still says upcoming for a moment', async () => {
    vi.useFakeTimers({
      now: BEFORE_START,
      toFake: ['Date', 'setInterval', 'clearInterval', 'setTimeout', 'clearTimeout'],
    });
    const registered = contestDetail({
      phase: 'upcoming',
      viewer: contestViewer({
        liveStatus: 'registered',
        liveParticipation: participationSummary({ isRegistered: true }),
      }),
    });
    const started = contestDetail({
      viewer: contestViewer({
        liveStatus: 'registered',
        liveParticipation: participationSummary({ isRegistered: true }),
      }),
    });
    const calls = mockApi({
      ...signedInViewer(),
      ...contestPageRoutes(registered),
      'GET /contests/r42': sequence(ok(registered), ok(registered), ok(started)),
    });
    const { wrapper } = await mountApp('/contests/r42');
    const detailCalls = () => calls.filter((call) => call.path === '/contests/r42').length;
    vi.advanceTimersByTime(3000);
    await flushPromises();
    expect(detailCalls()).toBe(2);
    expect(buttonNamed(wrapper, 'Vào thi').attributes('aria-disabled')).toBeUndefined();
    vi.advanceTimersByTime(1500);
    await flushPromises();
    expect(detailCalls()).toBe(3);
    expect(buttonNamed(wrapper, 'Vào thi').attributes('aria-disabled')).toBeUndefined();
  });

  it('offers a virtual run after the end, or says it is not allowed', async () => {
    mockApi({ ...signedInViewer(), ...contestPageRoutes(contestDetail({ phase: 'ended' })) });
    const { wrapper } = await mountApp('/contests/r42');
    expect(buttonNamed(wrapper, 'Bắt đầu thi ảo').exists()).toBe(true);
    expect(actionsOf(wrapper).text()).toContain('Kết quả chỉ hiện ở bảng khi chọn “Gồm thi ảo”');
    wrapper.unmount();
    mockApi({
      ...signedInViewer(),
      ...contestPageRoutes(contestDetail({ phase: 'ended', disallowVirtual: true })),
    });
    const second = await mountApp('/contests/r42');
    expect(actionsOf(second.wrapper).text()).toContain(
      'Ban tổ chức không cho phép thi ảo kỳ thi này.',
    );
  });

  it('shows the running virtual run with its own countdown', async () => {
    vi.useFakeTimers({ now: NOW, toFake: ['Date'] });
    const virtualRun = participationSummary({ virtual: 2, endTime: '2026-10-08T10:49:12Z' });
    mockApi({
      ...signedInViewer(),
      ...contestPageRoutes(
        contestDetail({
          phase: 'ended',
          viewer: contestViewer({ inContest: true, isCurrent: true }),
        }),
      ),
      'GET /contests/current': ok({
        contest: { key: 'r42', name: 'x', startTime: '', endTime: '' },
        participation: virtualRun,
      }),
    });
    const { wrapper } = await mountApp('/contests/r42');
    expect(actionsOf(wrapper).text()).toContain('Thi ảo #2 đang chạy');
    expect(actionsOf(wrapper).get('[role="timer"]').text()).toBe('01:12:05');
  });
});

const pressEscape = () =>
  document.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape', bubbles: true }));
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

  it('closes the dialog on Escape and forgets its error the same way', async () => {
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
    pressEscape();
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

  it.each([
    ['contest_not_started', 409, 'Kỳ thi chưa bắt đầu. Hãy quay lại khi kỳ thi mở.'],
    ['registration_closed', 409, 'Kỳ thi này đã đóng đăng ký. Bạn không thể đăng ký thêm.'],
    ['virtual_disallowed', 409, 'Ban tổ chức không cho phép thi ảo kỳ thi này.'],
    ['not_registered', 409, 'Bạn chưa đăng ký kỳ thi này.'],
    ['banned_from_contest', 403, 'Bạn bị cấm tham gia kỳ thi này.'],
    ['rate_limited', 429, 'Bạn thao tác quá nhanh. Hãy thử lại sau.'],
  ])('says what %s means, next to the sweating Bit', async (code, status, text) => {
    vi.useFakeTimers({ now: NOW, toFake: ['Date'] });
    mockApi({
      ...signedInViewer(),
      ...contestPageRoutes(),
      'POST /contests/r42/join': fail(status, code),
    });
    const { wrapper } = await mountApp('/contests/r42');
    await buttonNamed(wrapper, 'Vào thi').trigger('click');
    await flushPromises();
    const alert = actionsOf(wrapper).get('[role="alert"]');
    expect(alert.text()).toBe(text);
    expect(alert.find('[aria-hidden="true"]').exists()).toBe(true);
  });

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

  it('keeps a wrong code inside the dialog in words', async () => {
    vi.useFakeTimers({ now: NOW, toFake: ['Date'] });
    mockApi({
      ...signedInViewer(),
      ...contestPageRoutes(contestDetail({ requiresAccessCode: true })),
      'POST /contests/r42/join': fail(403, 'wrong_access_code'),
    });
    const { wrapper } = await mountApp('/contests/r42');
    await buttonNamed(wrapper, 'Vào thi').trigger('click');
    await flushPromises();
    const input = dialog()!.querySelector<HTMLInputElement>('input')!;
    input.value = 'x';
    input.dispatchEvent(new Event('input'));
    await flushPromises();
    dialog()!.querySelector('form')!.dispatchEvent(new Event('submit'));
    await flushPromises();
    expect(dialog()!.querySelector('[role="alert"]')!.textContent.trim()).toBe(
      'Mã tham gia chưa đúng. Kiểm tra lại mã với ban tổ chức rồi nhập lại.',
    );
  });

  it.each(PARTICIPATION_REFUSALS)('gives %s its own text rather than the generic one', (code) => {
    expect(errorMessageKey(new ApiError(code, 409, 'x'))).toBe(`errors.${code}`);
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
    expect(joinBodies(calls)).toEqual([{ acceptRules: true }]);
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
    expect(joinBodies(calls)).toEqual([{ acceptRules: true }]);
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
    expect(joinBodies(calls)).toEqual([{ accessCode: 'opensesame', acceptRules: true }]);
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
    expect(dialog()!.querySelector('[role="alert"]')!.textContent).toContain('Hãy chọn ô đồng ý');
    expect(
      calls.filter((call) => call.path === '/contests/r42' && call.method === 'GET').length,
    ).toBeGreaterThanOrEqual(2);
    await tickAndConfirm();
    expect(joinBodies(calls)).toEqual([{}, { acceptRules: true }]);
  });

  it('sends one request for a double confirm', async () => {
    vi.useFakeTimers({ now: NOW, toFake: ['Date'] });
    const calls = mockApi({
      ...signedInViewer(),
      ...contestPageRoutes(ruled()),
      'POST /contests/r42/join': ok(participationSummary()),
    });
    const { wrapper } = await mountApp('/contests/r42');
    await buttonNamed(wrapper, 'Vào thi').trigger('click');
    await flushPromises();
    dialog()!.querySelector<HTMLInputElement>('input[type="checkbox"]')!.click();
    await flushPromises();
    const form = dialog()!.querySelector('form')!;
    form.dispatchEvent(new Event('submit'));
    await nextTick();
    form.dispatchEvent(new Event('submit'));
    await flushPromises();
    expect(joinBodies(calls)).toHaveLength(1);
  });
});

describe('virtual run rules dialog: previous acceptance', () => {
  const ended = (liveParticipation: ReturnType<typeof participationSummary> | null) =>
    contestDetail({
      phase: 'ended',
      rules: RULES_MARKDOWN,
      rulesHtml: RULES_HTML,
      rulesRevision: 3,
      viewer: contestViewer({ liveStatus: 'finished', liveParticipation }),
    });
  const open = async (detail: ReturnType<typeof contestDetail>) => {
    mockApi({ ...signedInViewer(), ...contestPageRoutes(detail) });
    const { wrapper } = await mountApp('/contests/r42');
    await buttonNamed(wrapper, 'Bắt đầu thi ảo').trigger('click');
    await flushPromises();
  };

  it('shows the revision the live run accepted', async () => {
    await open(
      ended(
        participationSummary({
          rulesAcceptedAt: '2026-10-08T05:58:00.000Z',
          rulesAcceptedRevision: 2,
        }),
      ),
    );
    expect(dialog()!.textContent).toContain('Lượt trước của bạn đã đồng ý bản 2 lúc');
  });

  it('shows no previous line when the live run accepted nothing', async () => {
    await open(ended(participationSummary()));
    expect(dialog()!.textContent).not.toContain('Lượt trước của bạn');
  });
});
