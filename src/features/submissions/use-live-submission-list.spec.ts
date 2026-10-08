import { flushPromises } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FakeEventSource, installFakeEventSource } from '@/test/fake-event-source';
import { submissionItem } from '@/test/fixtures';
import { mockApi, page, sequence } from '@/test/mock-api';
import type { ApiCall } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { anonymousViewer, submissionListRoutes } from '@/test/problem-routes';
import { LIVE_SETTLE_MS } from './use-live-submission-list';

beforeEach(() => {
  installFakeEventSource();
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
});
afterEach(() => vi.useRealTimers());

const feed = () =>
  FakeEventSource.instances.find((source) => source.url.endsWith('/events/submissions'))!;
const frame = (type: 'queued' | 'processing' | 'grading-begin' | 'done', submissionId: string) => ({
  submissionId,
  userId: 'u',
  problemId: 'p',
  type,
  status: type === 'done' ? 'D' : 'QU',
});
const row = (id: string) => submissionItem({ id });
const listCalls = (calls: ApiCall[]) => calls.filter((call) => call.path === '/submissions');
const announcement = (wrapper: { find: (selector: string) => { text: () => string } }) =>
  wrapper.find('#main [role="status"][aria-live="polite"]').text();
async function openList(path = '/submissions') {
  const mounted = await mountApp(path);
  await vi.waitFor(() => expect(mounted.wrapper.find('tbody tr').exists()).toBe(true));
  return mounted;
}
/** Page 2 of 100 rows, and the page-1 probe (`pageSize=1`) answering `probeTotal`. */
const pageTwoRoutes = (probeTotal: number | undefined) => ({
  ...anonymousViewer,
  ...submissionListRoutes,
  'GET /submissions': ({ query }: ApiCall) =>
    query.get('pageSize') === '1'
      ? {
          body: {
            data: [row('top')],
            meta: {
              page: 1,
              pageSize: 1,
              ...(probeTotal === undefined ? {} : { total: probeTotal }),
            },
          },
        }
      : page([row('p2')], { page: 2, total: 100 }),
});

describe('live updates on the submission list', () => {
  it('refetches once for a burst of frames and prepends the new matching row on page 1', async () => {
    const calls = mockApi({
      ...anonymousViewer,
      ...submissionListRoutes,
      'GET /submissions': sequence(page([row('a')]), page([row('new'), row('a')])),
    });
    const { wrapper } = await openList();
    for (let index = 0; index < 50; index += 1) feed().emit('queued', frame('queued', `x${index}`));
    await vi.advanceTimersByTimeAsync(LIVE_SETTLE_MS - 1);
    expect(listCalls(calls)).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(1);
    await flushPromises();
    expect(listCalls(calls)).toHaveLength(2);
    expect(wrapper.findAll('tbody tr').map((tr) => tr.attributes('data-id'))).toEqual(['new', 'a']);
  });
  it('announces the added count once, not once per row or per frame', async () => {
    mockApi({
      ...anonymousViewer,
      ...submissionListRoutes,
      'GET /submissions': sequence(page([row('a')]), page([row('new'), row('a')])),
    });
    const { wrapper } = await openList();
    expect(announcement(wrapper)).toBe('');
    for (let index = 0; index < 5; index += 1) feed().emit('queued', frame('queued', `x${index}`));
    await vi.advanceTimersByTimeAsync(LIVE_SETTLE_MS);
    await flushPromises();
    expect(announcement(wrapper)).toBe('Có 1 bài nộp mới');
  });
  it('ignores a progress frame of a submission that is not on the page', async () => {
    const calls = mockApi({ ...anonymousViewer, ...submissionListRoutes });
    await openList();
    feed().emit('processing', frame('processing', 'not-shown'));
    await vi.advanceTimersByTimeAsync(LIVE_SETTLE_MS * 2);
    expect(listCalls(calls)).toHaveLength(1);
  });
  it('refetches when a shown row finishes and refreshes the stats', async () => {
    const calls = mockApi({ ...anonymousViewer, ...submissionListRoutes });
    await openList();
    feed().emit('done', frame('done', 'sub-1'));
    await vi.advanceTimersByTimeAsync(LIVE_SETTLE_MS);
    await flushPromises();
    expect(listCalls(calls)).toHaveLength(2);
    expect(calls.filter((call) => call.path === '/submissions/stats')).toHaveLength(2);
  });
  it('on page 2 shows an N new pill from the growth of meta.total and leaves the shown rows alone', async () => {
    const calls = mockApi(pageTwoRoutes(105));
    const { wrapper } = await openList('/submissions?page=2');
    feed().emit('queued', frame('queued', 'x'));
    await vi.advanceTimersByTimeAsync(LIVE_SETTLE_MS);
    await flushPromises();
    expect(wrapper.get('[data-testid="new-pill"]').text()).toContain('5');
    expect(wrapper.findAll('tbody tr').map((tr) => tr.attributes('data-id'))).toEqual(['p2']);
    const probe = calls.at(-1)!;
    expect([probe.query.get('page'), probe.query.get('pageSize')]).toEqual(['1', '1']);
  });
  it('goes to page 1 and clears the count when the pill is clicked', async () => {
    mockApi(pageTwoRoutes(105));
    const { wrapper, router } = await openList('/submissions?page=2');
    feed().emit('queued', frame('queued', 'x'));
    await vi.advanceTimersByTimeAsync(LIVE_SETTLE_MS);
    await flushPromises();
    await wrapper.get('[data-testid="new-pill"]').trigger('click');
    await vi.waitFor(() => expect(router.currentRoute.value.query.page).toBeUndefined());
    expect(wrapper.find('[data-testid="new-pill"]').exists()).toBe(false);
  });
  it('counts the queued frames when the API sends no total', async () => {
    mockApi(pageTwoRoutes(undefined));
    const { wrapper } = await openList('/submissions?page=2');
    for (const id of ['x1', 'x2', 'x3']) feed().emit('queued', frame('queued', id));
    await vi.advanceTimersByTimeAsync(LIVE_SETTLE_MS);
    await flushPromises();
    expect(wrapper.get('[data-testid="new-pill"]').text()).toContain('3');
  });
  it('opens no stream while Live updates is off, opens one when it is switched on and closes it when off again', async () => {
    mockApi({ ...anonymousViewer, ...submissionListRoutes });
    const { wrapper } = await openList('/submissions?live=0');
    expect(
      FakeEventSource.instances.filter((source) => source.url.endsWith('/events/submissions')),
    ).toHaveLength(0);
    await wrapper.get('input[data-testid="live-toggle"]').setValue(true);
    // The toggle writes the URL through the router, which settles after the click.
    await vi.waitFor(() => expect(feed().closed).toBe(false));
    await wrapper.get('input[data-testid="live-toggle"]').setValue(false);
    await vi.waitFor(() => expect(feed().closed).toBe(true));
  });
  it('resets the pill and the baseline when a filter changes', async () => {
    mockApi(pageTwoRoutes(105));
    const { wrapper } = await openList('/submissions?page=2');
    feed().emit('queued', frame('queued', 'x'));
    await vi.advanceTimersByTimeAsync(LIVE_SETTLE_MS);
    await flushPromises();
    await wrapper.get('input[type="checkbox"][value="AC"]').setValue(true);
    await flushPromises();
    expect(wrapper.find('[data-testid="new-pill"]').exists()).toBe(false);
  });
  it('shows the paused hint when the stream closes for good, and not for a reconnecting one', async () => {
    mockApi({ ...anonymousViewer, ...submissionListRoutes });
    const { wrapper } = await openList();
    feed().fail(true);
    await flushPromises();
    expect(wrapper.find('[data-testid="live-paused"]').exists()).toBe(false);
    feed().fail();
    await flushPromises();
    expect(wrapper.get('[data-testid="live-paused"]').text()).toContain(
      'Cập nhật trực tiếp tạm dừng',
    );
  });
  it('keeps one polite status element in the page', async () => {
    mockApi({ ...anonymousViewer, ...submissionListRoutes });
    const { wrapper } = await openList();
    expect(wrapper.findAll('#main [role="status"][aria-live="polite"]')).toHaveLength(1);
  });
});
