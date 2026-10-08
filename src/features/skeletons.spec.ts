import { describe, expect, it, vi } from 'vitest';
import { problemEditorial, signedIn, signedOut } from '@/test/fixtures';
import { contestPageRoutes } from '@/test/contest-routes';
import { hangRequestsExcept, mockApi, ok } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import {
  anonymousViewer,
  problemPageRoutes,
  signedInViewer,
  submissionListRoutes,
  submissionPageRoutes,
} from '@/test/problem-routes';

const regionsIn = (root: ParentNode, region: string) =>
  root.querySelectorAll(`[data-skeleton-region="${region}"]`).length;
/** Skeletons are decoration: no text to read, nothing to focus or click. */
const expectInert = (root: Element, label: string) => {
  expect(root.textContent?.trim(), label).toBe('');
  expect(
    root.querySelectorAll('a, button, input, textarea, select, [tabindex]'),
    label,
  ).toHaveLength(0);
};
/** Holds only the announcement list, so its skeletons stay on screen. */
function holdAnnouncements() {
  const answer = globalThis.fetch;
  vi.stubGlobal('fetch', (input: string, init?: RequestInit) =>
    String(input).includes('/announcements')
      ? new Promise<Response>(() => {})
      : answer(input, init),
  );
}
const blocksIn = (root: ParentNode) => root.querySelectorAll('[data-skeleton]').length;

describe('loading screens show blocks shaped like their content', () => {
  it('the signed-in home page fills every card with blocks, announces nothing itself and shows no loading text', async () => {
    mockApi({ 'GET /auth/me': signedIn() });
    hangRequestsExcept(['/auth/me']);
    const { wrapper } = await mountApp('/');
    const dom = wrapper.element;
    for (const testId of ['rating-hero', 'recent-submissions', 'live-contest', 'top-users']) {
      const card = dom.querySelector(`[data-testid="${testId}"]`)!;
      expect(blocksIn(card), testId).toBeGreaterThan(0);
      expect(card.textContent?.includes('Đang tải'), testId).toBe(false);
      expect(card.querySelector('[role="status"]'), testId).toBeNull(); // the shell announces loading once
    }
    const regionCounts: Record<string, Record<string, number>> = {
      'rating-hero': { greeting: 1, rating: 1, tier: 1, chart: 1, tile: 3 },
      'live-contest': { label: 1, name: 1, countdown: 1, enter: 1 },
    };
    for (const [testId, regions] of Object.entries(regionCounts)) {
      const card = dom.querySelector(`[data-testid="${testId}"]`)!;
      for (const [region, count] of Object.entries(regions))
        expect(regionsIn(card, region), `${testId} ${region}`).toBe(count);
    }
    for (const skeleton of dom.querySelectorAll('[data-testid="query-skeleton"]'))
      expectInert(skeleton, 'skeleton');
    // The lists show the page-size number of rows.
    expect(dom.querySelectorAll('[data-testid="top-users"] li')).toHaveLength(3);
    expect(dom.querySelectorAll('[data-testid="recent-submissions"] li')).toHaveLength(4);
  });

  it('the problems page shows a table skeleton with the real header cells and 8 rows, hidden from assistive tech', async () => {
    mockApi({ 'GET /auth/me': signedOut });
    hangRequestsExcept(['/auth/me']);
    const { wrapper } = await mountApp('/problems');
    const skeleton = wrapper.get('[data-testid="query-skeleton"]');
    expect(skeleton.attributes('aria-hidden')).toBe('true');
    expect(skeleton.findAll('tbody tr')).toHaveLength(8);
    expect(skeleton.findAll('thead th')).toHaveLength(6);
    expectInert(skeleton.element, 'problem table skeleton');
    expect(wrapper.findAll('table[aria-hidden="true"] [data-skeleton]').length).toBeGreaterThan(8);
  });

  it('the ranking page shows skeletons for the contest header and the board', async () => {
    mockApi({ 'GET /auth/me': signedOut });
    hangRequestsExcept(['/auth/me']);
    const { wrapper } = await mountApp('/contests/r42/ranking');
    expect(wrapper.findAll('[data-testid="query-skeleton"]').length).toBeGreaterThanOrEqual(1);
    expect(blocksIn(wrapper.element)).toBeGreaterThan(0);
    for (const region of ['nav', 'title', 'controls'])
      expect(regionsIn(wrapper.element, region), region).toBe(1);
    expect(regionsIn(wrapper.element, 'row')).toBe(0); // the board mounts once the contest is known
  });

  it('the ranking board skeleton has the podium, the table header and 10 rows once the contest is known', async () => {
    mockApi({ 'GET /auth/me': signedOut, ...contestPageRoutes() });
    // Hold only the ranking request; the contest answers.
    const answer = globalThis.fetch;
    vi.stubGlobal('fetch', (input: string, init?: RequestInit) =>
      String(input).includes('/ranking') ? new Promise<Response>(() => {}) : answer(input, init),
    );
    const { wrapper } = await mountApp('/contests/r42/ranking');
    const board = wrapper.findAll('[data-testid="query-skeleton"]').at(-1)!.element;
    expect(regionsIn(board, 'podium')).toBe(1);
    expect(regionsIn(board, 'podium-card')).toBe(3);
    expect(regionsIn(board, 'table-header')).toBe(1);
    expect(regionsIn(board, 'row')).toBe(10);
    expectInert(board, 'ranking board skeleton');
  });

  it('the problem page shows the header and statement skeletons, inert and hidden from assistive tech', async () => {
    mockApi({ ...anonymousViewer });
    hangRequestsExcept(['/auth/me']);
    const { wrapper } = await mountApp('/problems/duongdi');
    for (const region of ['meta', 'title', 'chips', 'limits', 'statement'])
      expect(regionsIn(wrapper.element, region), region).toBe(1);
    expect(regionsIn(wrapper.element, 'limit')).toBe(4);
    for (const skeleton of wrapper.findAll('[data-testid="query-skeleton"]')) {
      expect(skeleton.attributes('aria-hidden')).toBe('true');
      expectInert(skeleton.element, 'problem skeleton');
    }
    expect(blocksIn(wrapper.element)).toBeGreaterThan(5);
  });
});

describe('the editorial tab loads with a statement-shaped skeleton', () => {
  it('shows the statement blocks inside its own panel, inert, while the editorial is on its way', async () => {
    mockApi({
      ...anonymousViewer,
      ...problemPageRoutes(),
      'GET /problems/duongdi/editorial': ok(problemEditorial()),
    });
    const served = globalThis.fetch;
    vi.stubGlobal('fetch', (input: string, init?: RequestInit) =>
      String(input).includes('/editorial') ? new Promise<Response>(() => {}) : served(input, init),
    );
    const { wrapper } = await mountApp('/problems/duongdi?tab=editorial');
    const panel = wrapper.get('#problem-panel-editorial');
    await vi.waitFor(() =>
      expect(panel.find('[data-skeleton-region="statement"]').exists()).toBe(true),
    );
    expectInert(panel.get('[data-testid="query-skeleton"]').element, 'editorial skeleton');
  });
});

describe('the submission page loads with skeletons shaped like its cards', () => {
  it('shows the ring, score, line, facts and case rows inert while the detail is on its way', async () => {
    mockApi({ ...signedInViewer() });
    hangRequestsExcept(['/auth/me', '/profile']);
    const { wrapper } = await mountApp('/submissions/sub-1');
    for (const region of ['ring', 'score', 'line', 'facts'])
      expect(regionsIn(wrapper.element, region), region).toBe(1);
    expect(regionsIn(wrapper.element, 'fact')).toBe(6);
    expect(regionsIn(wrapper.element, 'case-row')).toBe(6);
    expect(wrapper.findAll('table[aria-hidden="true"] thead th')).toHaveLength(5);
    for (const skeleton of wrapper.findAll('[data-testid="query-skeleton"]')) {
      expect(skeleton.attributes('aria-hidden')).toBe('true');
      expectInert(skeleton.element, 'submission skeleton');
    }
  });

  it('shows only the source lines while the source is on its way', async () => {
    mockApi({ ...signedInViewer(), ...submissionPageRoutes(), ...problemPageRoutes() });
    const served = globalThis.fetch;
    vi.stubGlobal('fetch', (input: string, init?: RequestInit) =>
      String(input).includes('/source') ? new Promise<Response>(() => {}) : served(input, init),
    );
    const { wrapper } = await mountApp('/submissions/sub-1');
    await vi.waitFor(() => expect(regionsIn(wrapper.element, 'source-line')).toBe(10));
    expect(regionsIn(wrapper.element, 'ring')).toBe(0);
    expect(wrapper.find('[data-testid="score"]').exists()).toBe(true);
    const skeletons = wrapper.findAll('[data-testid="query-skeleton"]');
    expect(skeletons).toHaveLength(1);
    expectInert(skeletons[0]!.element, 'source skeleton');
  });
});

describe('the submission list page loads its stats strip and table as independent cards', () => {
  it('shows four tiles and a table skeleton with the 8 real header cells and 10 rows, all inert', async () => {
    mockApi({ ...anonymousViewer });
    hangRequestsExcept(['/auth/me']);
    const { wrapper } = await mountApp('/submissions');
    const strip = wrapper.get('[data-testid="stats-strip"]').element;
    expect(regionsIn(strip, 'tile')).toBe(4);
    expect(regionsIn(strip, 'value')).toBe(4);
    expect(regionsIn(strip, 'label')).toBe(4);
    const card = wrapper.get('[data-testid="submission-table-card"]');
    expect(card.findAll('thead th')).toHaveLength(8);
    expect(regionsIn(card.element, 'row')).toBe(10);
    for (const skeleton of wrapper.findAll('[data-testid="query-skeleton"]')) {
      expect(skeleton.attributes('aria-hidden')).toBe('true');
      expectInert(skeleton.element, 'submission list skeleton');
    }
  });

  it('shows the rows while only the stats are still loading', async () => {
    mockApi({ ...anonymousViewer, ...submissionListRoutes });
    const served = globalThis.fetch;
    vi.stubGlobal('fetch', (input: string, init?: RequestInit) =>
      String(input).includes('/submissions/stats')
        ? new Promise<Response>(() => {})
        : served(input, init),
    );
    const { wrapper } = await mountApp('/submissions');
    await vi.waitFor(() => expect(wrapper.find('tbody tr[data-id="sub-1"]').exists()).toBe(true));
    expect(regionsIn(wrapper.get('[data-testid="stats-strip"]').element, 'tile')).toBe(4);
  });

  it('the announcements page and the contest rail show inert rows while the list loads', async () => {
    mockApi({ 'GET /auth/me': signedOut, ...contestPageRoutes() });
    holdAnnouncements();
    const { wrapper } = await mountApp('/contests/r42/announcements');
    const rows = wrapper.findAll('[data-skeleton-region="announcement"]');
    expect(rows).toHaveLength(3);
    for (const row of rows) expectInert(row.element, 'announcement skeleton');
    expect(wrapper.get('main').text()).not.toContain('Chưa có thông báo');
  });

  it('the contest rail shows one inert skeleton, not the empty text, while the list loads', async () => {
    mockApi({ 'GET /auth/me': signedOut, ...contestPageRoutes() });
    holdAnnouncements();
    const { wrapper } = await mountApp('/contests/r42');
    const rail = wrapper.get('[data-skeleton-region="announcement-rail"]');
    expect(regionsIn(wrapper.element, 'announcement-rail')).toBe(1);
    expectInert(rail.element, 'rail skeleton');
    expect(wrapper.get('aside').text()).not.toContain('Chưa có thông báo.');
  });
});
