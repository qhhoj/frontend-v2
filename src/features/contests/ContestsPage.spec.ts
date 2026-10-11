import { flushPromises } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { contestItem } from '@/test/fixtures';
import { contestListRoutes } from '@/test/contest-routes';
import { TAG_CATALOGUE } from '@/test/contest-extras-fixtures';
import { fail, mockApi, page } from '@/test/mock-api';
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

  it('drops a running contest when its end passes and asks the server once more', async () => {
    vi.useFakeTimers({ now: NOW, toFake: ['Date', 'setInterval', 'clearInterval'] });
    const endsSoon = contestItem({ key: 'soon', endTime: '2026-10-08T09:38:00Z' });
    let runningRequests = 0;
    const calls = mockApi({
      ...anonymousViewer,
      'GET /contest-tags': page([]),
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
      registrationEnd: '2026-10-10T17:00:00Z',
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

  it('says a page past the last does not exist, with a way back to page 1, not that nothing ended', async () => {
    mockApi({ ...anonymousViewer, ...contestListRoutes({}) });
    const { wrapper } = await mountApp('/contests?phase=ended&page=99');
    const ended = wrapper.get('section[aria-labelledby="contest-group-ended"]');
    expect(ended.text()).toContain('Trang này không tồn tại.');
    expect(ended.text()).not.toContain('Chưa có kỳ thi nào kết thúc');
    expect(ended.get('a[href="/contests?phase=ended"]').text()).toContain('Về trang 1');
  });
});

describe('contest list tag filter', () => {
  afterEach(() => vi.useRealTimers());
  const tagged = contestItem({ tags: ['quoc-gia', 'tin-hoc-tre-2019'] });
  const withCatalogue = { 'GET /contest-tags': page(TAG_CATALOGUE) };

  it('sends the chosen tag with every group and colours the row chips from the catalogue', async () => {
    vi.useFakeTimers({ now: NOW, toFake: ['Date'] });
    const calls = mockApi({
      ...anonymousViewer,
      ...contestListRoutes({ running: [tagged] }),
      ...withCatalogue,
    });
    const { wrapper } = await mountApp('/contests?tag=quoc-gia');
    await flushPromises();
    expect(groupCalls(calls).map((query) => query.tag)).toEqual([
      'quoc-gia',
      'quoc-gia',
      'quoc-gia',
    ]);
    const chips = wrapper.get('[data-testid="running-contest"]').findAll('[data-tag-color]');
    expect(chips.map((chip) => [chip.text(), chip.attributes('data-tag-color')])).toEqual([
      ['Quốc gia', 'tag-5'],
      ['tin-hoc-tre-2019', 'neutral'],
    ]);
  });

  it('writes a chosen chip to the URL and starts again at page 1', async () => {
    mockApi({ ...anonymousViewer, ...contestListRoutes({}), ...withCatalogue });
    const { wrapper, router } = await mountApp('/contests?phase=ended&page=3');
    await flushPromises();
    const chip = wrapper
      .findAll('[data-testid="tag-filter"] button')
      .find((button) => button.text() === 'ICPC')!;
    await chip.trigger('click');
    await flushPromises();
    expect(router.currentRoute.value.query).toEqual({ phase: 'ended', tag: 'icpc' });
  });

  it('lists every contest for a tag the catalogue does not hold, and says so', async () => {
    const calls = mockApi({ ...anonymousViewer, ...contestListRoutes({}), ...withCatalogue });
    const { wrapper } = await mountApp('/contests?tag=abc-xyz');
    await flushPromises();
    const lastRound = groupCalls(calls).slice(-3);
    expect(lastRound.every((query) => query.tag === undefined)).toBe(true);
    expect(wrapper.get('[data-testid="tag-unknown"]').text()).toContain('abc-xyz');
  });

  it('keeps the list working when the catalogue fails, and still filters by the address tag', async () => {
    vi.useFakeTimers({ now: NOW, toFake: ['Date'] });
    const calls = mockApi({
      ...anonymousViewer,
      ...contestListRoutes({ running: [tagged] }),
      'GET /contest-tags': fail(500, 'generic'),
    });
    const { wrapper } = await mountApp('/contests?tag=quoc-gia');
    await flushPromises();
    expect(wrapper.find('[data-testid="tag-failed"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="running-contest"]').exists()).toBe(true);
    expect(groupCalls(calls)[0]!.tag).toBe('quoc-gia');
  });
});
