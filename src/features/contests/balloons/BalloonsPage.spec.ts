import { flushPromises } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { balloon } from '@/test/contest-extras-fixtures';
import { contestPageRoutes } from '@/test/contest-routes';
import { contestDetail, contestViewer } from '@/test/fixtures';
import { fail, failWithCode, mockApi, noContent, page, sequence } from '@/test/mock-api';
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
});
