import { flushPromises } from '@vue/test-utils';
import { nextTick } from 'vue';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { contestDetail, contestViewer, participationSummary } from '@/test/fixtures';
import { contestPageRoutes } from '@/test/contest-routes';
import { fail, mockApi, noContent, ok, sequence } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { anonymousViewer, signedInViewer } from '@/test/problem-routes';

const NOW = Date.parse('2026-10-08T09:37:07Z');
const BEFORE_START = Date.parse('2026-10-08T07:59:58Z');
const actionsOf = (wrapper: Awaited<ReturnType<typeof mountApp>>['wrapper']) =>
  wrapper.get('[data-testid="contest-actions"]');
const buttonNamed = (wrapper: Awaited<ReturnType<typeof mountApp>>['wrapper'], name: string) =>
  actionsOf(wrapper)
    .findAll('button')
    .find((button) => button.text().startsWith(name))!;
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
      viewer: contestViewer({ inContest: true, liveParticipation: participationSummary() }),
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
      viewer: contestViewer({ inContest: true, liveParticipation: participationSummary() }),
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
    dialog()!.querySelector('form')!.dispatchEvent(new Event('submit'));
    await flushPromises();
    expect(dialog()!.querySelector('[role="alert"]')!.textContent).not.toBe('');
    expect(dialog()!.querySelector('[role="alert"] [aria-hidden="true"]')).not.toBeNull();
    input.value = 'opensesame';
    input.dispatchEvent(new Event('input'));
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
    dialog()!.querySelector<HTMLButtonElement>('form button[type="button"]')!.click();
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
      viewer: contestViewer({ liveParticipation: participationSummary({ isRegistered: true }) }),
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
      viewer: contestViewer({ liveParticipation: participationSummary({ isRegistered: true }) }),
    });
    const started = contestDetail({
      viewer: contestViewer({ liveParticipation: participationSummary({ isRegistered: true }) }),
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
        contestDetail({ phase: 'ended', viewer: contestViewer({ inContest: true }) }),
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
    dialog()!.querySelector('form')!.dispatchEvent(new Event('submit'));
    await flushPromises();
    const cancel = [...dialog()!.querySelectorAll('button')].find(
      (button) => button.textContent?.trim() === 'Hủy',
    )!;
    cancel.click();
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
    dialog()!.querySelector('form')!.dispatchEvent(new Event('submit'));
    await flushPromises();
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
