import { afterEach, describe, expect, it, vi } from 'vitest';
import { contestPageRoutes } from '@/test/contest-routes';
import { announcement, participationSummary } from '@/test/fixtures';
import { mockApi, ok, page } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { signedInViewer } from '@/test/problem-routes';

const NOW = Date.parse('2026-10-08T09:37:07Z');
const END = '2026-10-08T14:00:00Z';
const chip = '[data-testid="top-bar-live-contest"]';

function mockContest(virtual = 0, announcements: unknown[] = []) {
  mockApi({
    ...signedInViewer(),
    ...contestPageRoutes(),
    'GET /contests/current': ok({
      contest: {
        key: 'trash_ended',
        name: 'Trash Cup 2026',
        startTime: '2026-10-08T08:00:00Z',
        endTime: END,
      },
      participation: participationSummary({ endTime: END, virtual }),
    }),
    'GET /contests/trash_ended/announcements': page(announcements),
  });
}

describe('top bar contest chip', () => {
  afterEach(() => vi.useRealTimers());

  it('opens a menu with the four contest links and the unread count', async () => {
    vi.useFakeTimers({ now: NOW, toFake: ['Date'] });
    mockContest(0, [announcement(1), announcement(2)]);
    const { wrapper } = await mountApp('/contests/r42');
    await vi.waitFor(() => expect(wrapper.find(chip).exists()).toBe(true));
    await vi.waitFor(() =>
      expect(wrapper.find('[data-testid="top-bar-live-unread"]').text()).toContain('2'),
    );
    await wrapper.get(chip).trigger('click');
    const anchors = document.body.querySelectorAll('[role="dialog"] nav a');
    const hrefs = Array.from(anchors).map((anchor) => anchor.getAttribute('href'));
    expect(hrefs).toEqual([
      '/contests/trash_ended',
      '/contests/trash_ended/submissions',
      '/contests/trash_ended/ranking',
      '/contests/trash_ended/announcements',
    ]);
    expect(
      document.body.querySelector('[data-testid="top-bar-live-menu-unread"]')?.textContent,
    ).toContain('2');
  });

  it.each([
    [0, 'Bạn đang thi'],
    [3, 'Thi ảo #3'],
  ])('shows the state as visible text (virtual run %s)', async (virtual, label) => {
    vi.useFakeTimers({ now: NOW, toFake: ['Date'] });
    mockContest(virtual);
    const { wrapper } = await mountApp('/contests/r42');
    await vi.waitFor(() => expect(wrapper.find(chip).exists()).toBe(true));
    const state = wrapper.get('[data-testid="top-bar-live-state"]');
    expect(state.text()).toBe(label);
    expect(state.classes()).not.toContain('sr-only');
  });
});
