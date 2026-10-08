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
    await wrapper.get('select').setValue('rated');
    await flushPromises();
    expect(router.currentRoute.value.query).toMatchObject({ phase: 'ended', rated: '1' });
    expect(router.currentRoute.value.query.page).toBeUndefined();
  });

  it('marks a running contest that ends on a later day with its day offset', async () => {
    vi.stubEnv('TZ', 'UTC');
    vi.useFakeTimers({ now: NOW, toFake: ['Date'] });
    const overnight = contestItem({ endTime: '2026-10-09T01:00:00Z' });
    mockApi({ ...anonymousViewer, ...contestListRoutes({ running: [overnight] }) });
    const { wrapper } = await mountApp('/contests');
    expect(wrapper.get('[data-testid="running-contest"]').text()).toContain('01:00 (+1)');
    vi.unstubAllEnvs();
  });

  it('drops a running contest when its end passes and asks the server once more', async () => {
    vi.useFakeTimers({ now: NOW, toFake: ['Date', 'setInterval', 'clearInterval'] });
    const endsSoon = contestItem({ key: 'soon', endTime: '2026-10-08T09:38:00Z' });
    let runningRequests = 0;
    const calls = mockApi({
      ...anonymousViewer,
      'GET /contests': (call) => {
        if (call.query.get('phase') !== 'running')
          return { body: { data: [], meta: { page: 1, pageSize: 3, total: 0 } } };
        runningRequests += 1;
        const rows = runningRequests === 1 ? [endsSoon] : [];
        return { body: { data: rows, meta: { page: 1, pageSize: 100, total: rows.length } } };
      },
    });
    const { wrapper } = await mountApp('/contests');
    expect(wrapper.findAll('[data-testid="running-contest"]')).toHaveLength(1);
    vi.advanceTimersByTime(60_000);
    await flushPromises();
    expect(wrapper.findAll('[data-testid="running-contest"]')).toHaveLength(0);
    expect(groupCalls(calls).filter((query) => query.phase === 'running')).toHaveLength(2);
  });

  it('keeps the count out of the heading and names the group in its link', async () => {
    mockApi({ ...anonymousViewer, ...contestListRoutes({ running: [running] }) });
    const { wrapper } = await mountApp('/contests');
    expect(wrapper.get('#contest-group-running').text()).toBe('Đang diễn ra');
    expect(wrapper.get('section[aria-labelledby="contest-group-running"] a').text()).toContain(
      'Đang diễn ra',
    );
  });

  it('turns the rated filter on through the URL and back off', async () => {
    const calls = mockApi({ ...anonymousViewer, ...contestListRoutes({}) });
    const { wrapper, router } = await mountApp('/contests');
    await wrapper.get('select').setValue('rated');
    await flushPromises();
    expect(router.currentRoute.value.query.rated).toBe('1');
    expect(groupCalls(calls).at(-1)).toMatchObject({ rated: 'true' });
    await wrapper.get('select').setValue('any');
    await flushPromises();
    expect(router.currentRoute.value.query.rated).toBeUndefined();
  });

  it('shows an upcoming contest on its local day with its local hours, length and start', async () => {
    vi.stubEnv('TZ', 'Asia/Ho_Chi_Minh');
    vi.useFakeTimers({ now: NOW, toFake: ['Date'] });
    // 18:00Z on Oct 10 is 01:00 on Oct 11 in Vietnam.
    const upcoming = contestItem({
      key: 'r43',
      name: 'QHH Round #43',
      phase: 'upcoming',
      startTime: '2026-10-10T18:00:00Z',
      endTime: '2026-10-10T20:30:00Z',
    });
    mockApi({ ...anonymousViewer, ...contestListRoutes({ upcoming: [upcoming] }) });
    const { wrapper } = await mountApp('/contests');
    const row = wrapper.get('[data-testid="upcoming-contest"]');
    expect(row.get('[data-testid="day-chip"]').text()).toMatch(/^11\s*thg 10$/);
    expect(row.text()).toContain('01:00–03:30');
    expect(row.text()).toContain('2 giờ 30 phút');
    const registerLink = row.findAll('a').find((link) => link.text().includes('Xem & đăng ký'));
    expect(registerLink?.attributes('href')).toBe('/contests/r43');
    vi.unstubAllEnvs();
  });

  it('lists ended contests in a compact table with the virtual count and a virtual entry', async () => {
    const ended = contestItem({
      key: 'r41',
      name: 'QHH Round #41',
      phase: 'ended',
      virtualCount: 318,
      userCount: 1203,
    });
    mockApi({ ...anonymousViewer, ...contestListRoutes({ ended: [ended] }) });
    const { wrapper } = await mountApp('/contests');
    const row = wrapper.get('[data-testid="ended-contests"] tbody tr');
    expect(row.text()).toContain('QHH Round #41');
    expect(row.text()).toContain('1.203');
    expect(row.text()).toContain('+318 ảo');
    expect(row.find('a[href="/contests/r41"]').exists()).toBe(true);
  });

  it('says how many ended contests exist and opens that group alone with a pager', async () => {
    const many = Array.from({ length: 5 }, (_item, index) =>
      contestItem({ key: `old${index}`, phase: 'ended' }),
    );
    const calls = mockApi({
      ...anonymousViewer,
      ...contestListRoutes({}),
      'GET /contests': (call) =>
        call.query.get('phase') === 'ended'
          ? {
              body: {
                data: many,
                meta: {
                  page: Number(call.query.get('page')),
                  pageSize: Number(call.query.get('pageSize')),
                  total: 31,
                },
              },
            }
          : { body: { data: [], meta: { page: 1, pageSize: 3, total: 0 } } },
    });
    const { wrapper, router } = await mountApp('/contests');
    expect(wrapper.text()).toContain('5 trong 31');
    await router.push('/contests?phase=ended');
    await flushPromises();
    expect(wrapper.findAll('main h2')).toHaveLength(1);
    await wrapper.get('button[data-direction="next"]').trigger('click');
    await flushPromises();
    expect(router.currentRoute.value.query.page).toBe('2');
    expect(
      calls
        .filter((call) => call.path === '/contests')
        .at(-1)!
        .query.get('page'),
    ).toBe('2');
  });

  it('puts Bit in an empty upcoming group and points to the ended contests', async () => {
    mockApi({ ...anonymousViewer, ...contestListRoutes({}) });
    const { wrapper } = await mountApp('/contests');
    const upcoming = wrapper.get('section[aria-labelledby="contest-group-upcoming"]');
    expect(upcoming.text()).toContain('Chưa có kỳ thi sắp diễn ra');
    expect(upcoming.find('[role="img"]').exists()).toBe(true);
    expect(upcoming.get('a[href="/contests?phase=ended"]').text()).toContain(
      'Xem kỳ thi đã kết thúc',
    );
  });

  it('says no contest matches while a filter is set, without the upcoming hint', async () => {
    mockApi({ ...anonymousViewer, ...contestListRoutes({}) });
    const { wrapper } = await mountApp('/contests?search=zzz');
    const upcoming = wrapper.get('section[aria-labelledby="contest-group-upcoming"]');
    expect(upcoming.text()).toContain('Không có kỳ thi nào khớp bộ lọc');
    expect(upcoming.find('a[href="/contests?phase=ended"]').exists()).toBe(false);
  });
});
