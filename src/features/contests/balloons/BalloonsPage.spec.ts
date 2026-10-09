import { flushPromises } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { balloon } from '@/test/contest-extras-fixtures';
import { contestPageRoutes } from '@/test/contest-routes';
import { contestDetail, contestViewer } from '@/test/fixtures';
import {
  fail,
  failWithCode,
  issue,
  mockApi,
  noContent,
  page,
  rateLimited,
  sequence,
} from '@/test/mock-api';
import type { MockHandler } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { signedInViewer } from '@/test/problem-routes';

const PATH = '/contests/r42/balloons';
const LIST = 'GET /contests/r42/balloons';
const detail = contestDetail({ viewer: contestViewer({ canViewBalloons: true }) });
const base = (list: MockHandler) => ({
  ...signedInViewer(),
  ...contestPageRoutes(detail),
  [LIST]: list,
});
const listCalls = (calls: ReturnType<typeof mockApi>) =>
  calls.filter((call) => call.path === '/contests/r42/balloons');

describe('balloon screen', () => {
  afterEach(() => vi.useRealTimers());

  it('lists the pending queue with swatches, solve times, the first star and the counts', async () => {
    mockApi(base(page([balloon(0), balloon(3)], { total: 2, pendingTotal: 2, deliveredTotal: 5 })));
    const { wrapper } = await mountApp(PATH);
    const rows = wrapper.findAll('[data-testid="balloon-row"]');
    expect(rows).toHaveLength(2);
    expect(rows[0]!.get('[data-swatch]').classes()).toContain('text-tag-1');
    expect(rows[0]!.text()).toContain('0:04:00');
    expect(rows[0]!.find('[data-testid="first-solve"]').exists()).toBe(true);
    expect(rows[1]!.find('[data-testid="first-solve"]').exists()).toBe(false);
    expect(wrapper.get('[data-testid="pending-total"]').text()).toBe('2');
    expect(wrapper.get('[data-testid="delivered-total"]').text()).toBe('5');
  });

  it('delivers once for a double click, then reads the queue again', async () => {
    const item = balloon(0);
    const calls = mockApi({
      ...base(page([item], { pendingTotal: 1, deliveredTotal: 0 })),
      [`POST /contests/r42/balloons/${item.participationId}/${item.problemId}/deliver`]:
        noContent(),
    });
    const { wrapper } = await mountApp(PATH);
    const button = wrapper.get('[data-testid="balloon-row"] button');
    await button.trigger('click');
    await button.trigger('click');
    await flushPromises();
    expect(calls.filter((call) => call.path.endsWith('/deliver'))).toHaveLength(1);
    expect(listCalls(calls).length).toBeGreaterThanOrEqual(2);
  });

  it("shows another volunteer's delivery as a refusal and refreshes the row", async () => {
    const item = balloon(0);
    mockApi({
      ...base(
        sequence(
          page([item], { pendingTotal: 1 }),
          page([], { pendingTotal: 0, deliveredTotal: 1 }),
        ),
      ),
      [`POST /contests/r42/balloons/${item.participationId}/${item.problemId}/deliver`]:
        failWithCode(409, 'balloon', 'already_delivered'),
    });
    const { wrapper } = await mountApp(PATH);
    await wrapper.get('[data-testid="balloon-row"] button').trigger('click');
    await flushPromises();
    expect(wrapper.get('[data-testid="balloon-failure"]').text()).toContain(
      'Quả bóng này đã được giao.',
    );
    expect(wrapper.text()).toContain('Đã giao hết bóng.');
  });

  it('shows the rescore refusal with its own text, read from the issue code of a 404', async () => {
    const item = balloon(0);
    mockApi({
      ...base(page([item], { pendingTotal: 1 })),
      [`POST /contests/r42/balloons/${item.participationId}/${item.problemId}/deliver`]: fail(
        404,
        'not_found',
        undefined,
        [issue('problemId', 'balloon_not_found', 'No solve for this team.')],
      ),
    });
    const { wrapper } = await mountApp(PATH);
    await wrapper.get('[data-testid="balloon-row"] button').trigger('click');
    await flushPromises();
    expect(wrapper.get('[data-testid="balloon-failure"]').text()).toContain(
      'Đội này không còn lời giải đúng cho bài này.',
    );
  });

  it('moves focus to the next row when delivering removes the focused one', async () => {
    const [first, second] = [balloon(0), balloon(1)];
    mockApi({
      ...base(
        sequence(page([first, second], { pendingTotal: 2 }), page([second], { pendingTotal: 1 })),
      ),
      [`POST /contests/r42/balloons/${first.participationId}/${first.problemId}/deliver`]:
        noContent(),
    });
    const { wrapper } = await mountApp(PATH);
    const button = wrapper.get('[data-testid="balloon-row"] button');
    (button.element as HTMLElement).focus();
    await button.trigger('click');
    await flushPromises();
    const rows = wrapper.findAll('[data-testid="balloon-row"]');
    expect(rows).toHaveLength(1);
    expect(document.activeElement).toBe(rows[0]!.get('button').element);
  });

  it('moves focus to the state filter when the last pending balloon is delivered', async () => {
    const item = balloon(0);
    mockApi({
      ...base(
        sequence(
          page([item], { pendingTotal: 1 }),
          page([], { pendingTotal: 0, deliveredTotal: 1 }),
        ),
      ),
      [`POST /contests/r42/balloons/${item.participationId}/${item.problemId}/deliver`]:
        noContent(),
    });
    const { wrapper } = await mountApp(PATH);
    const button = wrapper.get('[data-testid="balloon-row"] button');
    (button.element as HTMLElement).focus();
    await button.trigger('click');
    await flushPromises();
    expect(document.activeElement?.getAttribute('aria-pressed')).toBe('true');
  });

  it('says how long to wait when the server rate-limits a delivery', async () => {
    const item = balloon(0);
    mockApi({
      ...base(page([item], { pendingTotal: 1 })),
      [`POST /contests/r42/balloons/${item.participationId}/${item.problemId}/deliver`]:
        rateLimited(7),
    });
    const { wrapper } = await mountApp(PATH);
    await wrapper.get('[data-testid="balloon-row"] button').trigger('click');
    await flushPromises();
    expect(wrapper.get('[data-testid="balloon-failure"]').text()).toContain('7');
  });

  it('hides times and counts for a frozen volunteer read, and says why', async () => {
    mockApi(
      base(page([balloon(0, { solvedAt: null })], { pendingTotal: null, deliveredTotal: null })),
    );
    const { wrapper } = await mountApp(PATH);
    expect(wrapper.get('[data-testid="balloon-row"]').text()).toContain('—');
    expect(wrapper.find('[data-testid="pending-total"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="balloons-frozen"]').exists()).toBe(true);
  });

  it('shows the not-found panel when balloons are off and the security panel for a contestant', async () => {
    mockApi(base(fail(404, 'not_found')));
    const first = await mountApp(PATH);
    expect(first.wrapper.get('[data-testid="state-panel"]').attributes('data-state')).toBe(
      'notFound',
    );
    first.wrapper.unmount();
    mockApi(base(fail(403, 'forbidden')));
    const second = await mountApp(PATH);
    expect(second.wrapper.get('[data-testid="state-panel"]').attributes('data-state')).toBe(
      'forbidden',
    );
  });

  it('switches state through the URL and asks that state', async () => {
    const calls = mockApi(base(page([])));
    const { wrapper, router } = await mountApp(PATH);
    await wrapper
      .findAll('button')
      .find((button) => button.text().startsWith('Đã giao'))!
      .trigger('click');
    await flushPromises();
    expect(router.currentRoute.value.query.state).toBe('delivered');
    expect(listCalls(calls).at(-1)!.query.get('state')).toBe('delivered');
  });

  it('polls every 10 s and stops when the page is left', async () => {
    const calls = mockApi(base(page([balloon(0)], { pendingTotal: 1 })));
    // Only the interval is faked: vue-query polls with setInterval, flushPromises still needs a real setTimeout.
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
    const { wrapper } = await mountApp(PATH);
    const first = listCalls(calls).length;
    await vi.advanceTimersByTimeAsync(10_000);
    expect(listCalls(calls).length).toBe(first + 1);
    wrapper.unmount();
    await vi.advanceTimersByTimeAsync(30_000);
    expect(listCalls(calls).length).toBe(first + 1);
  });

  it('shows inert skeleton rows while the queue loads', async () => {
    mockApi(base(page([])));
    const answer = globalThis.fetch;
    vi.stubGlobal('fetch', (input: string, init?: RequestInit) =>
      String(input).includes('/balloons') ? new Promise<Response>(() => {}) : answer(input, init),
    );
    const { wrapper } = await mountApp(PATH);
    expect(wrapper.findAll('[data-skeleton-region="balloon-row"]')).toHaveLength(6);
  });
});
