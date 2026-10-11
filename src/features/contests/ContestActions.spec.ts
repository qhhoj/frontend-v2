import { flushPromises } from '@vue/test-utils';
import { nextTick } from 'vue';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/api/client';
import { errorMessageKey } from '@/i18n/error-message';
import { contestDetail, contestViewer, participationSummary } from '@/test/fixtures';
import { contestPageRoutes } from '@/test/contest-routes';
import { fail, mockApi, ok, sequence } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { signedInViewer } from '@/test/problem-routes';
import { RULES_HTML, RULES_MARKDOWN } from '@/test/contest-extras-fixtures';
import { stubMatchMedia } from '@/test/match-media';
import { PARTICIPATION_REFUSALS } from './participation-refusal';

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
});

describe('contest actions: the phone bar tells the footer how tall it is', () => {
  const stubBarHeight = (blockSize: number) =>
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(private readonly callback: (entries: unknown[]) => void) {}
        observe() {
          this.callback([{ borderBoxSize: [{ blockSize }], contentRect: { height: 0 } }]);
        }
        unobserve() {}
        disconnect() {}
      },
    );
  const dockHeight = () => document.documentElement.style.getPropertyValue('--dock-height');

  it('publishes the bar height on a phone and removes it when the page goes', async () => {
    stubMatchMedia().setQuery('(max-width: 767.98px)', true);
    stubBarHeight(96);
    mockApi({ ...signedInViewer(), ...contestPageRoutes() });
    const { wrapper } = await mountApp('/contests/r42');
    await flushPromises();
    expect(dockHeight()).toBe('96px');
    wrapper.unmount();
    expect(dockHeight()).toBe('');
  });
});
