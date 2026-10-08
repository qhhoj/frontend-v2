import { flushPromises } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { contestItem } from '@/test/fixtures';
import { contestListRoutes } from '@/test/contest-routes';
import { mockApi } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { anonymousViewer } from '@/test/problem-routes';

const NOW = Date.parse('2026-10-08T09:37:07Z');
const running = contestItem(); // 08:00Z to 11:24:37Z
const groupCalls = (calls: ReturnType<typeof mockApi>) =>
  calls.filter((call) => call.path === '/contests').map((call) => Object.fromEntries(call.query));

describe('contest list', () => {
  afterEach(() => vi.useRealTimers());

  it('asks one page per phase group and lays the groups out in phase order', async () => {
    vi.useFakeTimers({ now: NOW, toFake: ['Date'] });
    const calls = mockApi({ ...anonymousViewer, ...contestListRoutes({ running: [running] }) });
    const { wrapper } = await mountApp('/contests');
    expect(groupCalls(calls)).toEqual([
      { phase: 'running', page: '1', pageSize: '100' },
      { phase: 'upcoming', page: '1', pageSize: '3' },
      { phase: 'ended', page: '1', pageSize: '5' },
    ]);
    expect(wrapper.findAll('main h2').map((heading) => heading.text())).toEqual([
      expect.stringContaining('Đang diễn ra'),
      expect.stringContaining('Sắp diễn ra'),
      expect.stringContaining('Đã kết thúc'),
    ]);
  });

  it('shows a running contest with its window, the time left in words and a way in', async () => {
    vi.useFakeTimers({ now: NOW, toFake: ['Date'] });
    mockApi({ ...anonymousViewer, ...contestListRoutes({ running: [running] }) });
    const { wrapper } = await mountApp('/contests');
    const card = wrapper.get('[data-testid="running-contest"]');
    expect(card.get('h3').text()).toBe('QHH Round #42 (Div. 2)');
    expect(card.text()).toContain('còn 1 giờ 47 phút');
    expect(card.text()).toContain('318 thí sinh');
    const enterLink = card.findAll('a').find((link) => link.text().includes('Vào thi'));
    expect(enterLink?.attributes('href')).toBe('/contests/r42');
  });

  it('says a time-limited contest runs per participation', async () => {
    vi.useFakeTimers({ now: NOW, toFake: ['Date'] });
    mockApi({
      ...anonymousViewer,
      ...contestListRoutes({ running: [contestItem({ timeLimit: 3 * 3600 })] }),
    });
    const { wrapper } = await mountApp('/contests');
    expect(wrapper.get('[data-testid="running-contest"]').text()).toContain(
      '3 giờ mỗi lượt kể từ lúc vào thi',
    );
  });

  it('sends the search and the rated filter from the URL to every group', async () => {
    const calls = mockApi({ ...anonymousViewer, ...contestListRoutes({}) });
    await mountApp('/contests?search=round&rated=1');
    for (const query of groupCalls(calls))
      expect(query).toMatchObject({ search: 'round', rated: 'true' });
  });

  it('moves the time left with the clock, every 15 seconds', async () => {
    vi.useFakeTimers({ now: NOW, toFake: ['Date', 'setInterval', 'clearInterval'] });
    mockApi({ ...anonymousViewer, ...contestListRoutes({ running: [running] }) });
    const { wrapper } = await mountApp('/contests');
    vi.advanceTimersByTime(45_000);
    await flushPromises();
    expect(wrapper.get('[data-testid="running-contest"]').text()).toContain('còn 1 giờ 46 phút');
  });

  it('starts again at page 1 when a filter changes, keeping the phase', async () => {
    mockApi({ ...anonymousViewer, ...contestListRoutes({}) });
    const { wrapper, router } = await mountApp('/contests?phase=ended&page=3');
    await wrapper.get('button[aria-pressed="false"]').trigger('click');
    await flushPromises();
    expect(router.currentRoute.value.query).toMatchObject({ phase: 'ended', rated: '1' });
    expect(router.currentRoute.value.query.page).toBeUndefined();
  });

  it('turns the rated filter on through the URL and back off', async () => {
    const calls = mockApi({ ...anonymousViewer, ...contestListRoutes({}) });
    const { wrapper, router } = await mountApp('/contests');
    await wrapper.get('button[aria-pressed="false"]').trigger('click');
    await flushPromises();
    expect(router.currentRoute.value.query.rated).toBe('1');
    expect(groupCalls(calls).at(-1)).toMatchObject({ rated: 'true' });
    await wrapper.get('button[aria-pressed="false"]').trigger('click');
    await flushPromises();
    expect(router.currentRoute.value.query.rated).toBeUndefined();
  });
});
