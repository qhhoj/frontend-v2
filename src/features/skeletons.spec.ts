import { describe, expect, it, vi } from 'vitest';
import { contestDetail, problemEditorial, signedIn, signedOut } from '@/test/fixtures';
import { hangRequestsExcept, mockApi, ok } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { anonymousViewer, problemPageRoutes } from '@/test/problem-routes';

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
const blocksIn = (root: ParentNode) => root.querySelectorAll('[data-skeleton]').length;

describe('loading screens show blocks shaped like their content', () => {
  it('the signed-in home page fills every card with blocks, announces nothing itself and shows no loading text', async () => {
    mockApi({ 'GET /auth/me': signedIn() });
    hangRequestsExcept(['/auth/me']);
    const { wrapper } = await mountApp('/');
    const dom = wrapper.element;
    for (const testId of [
      'rating-hero',
      'quick-submit',
      'recent-submissions',
      'live-contest',
      'top-users',
    ]) {
      const card = dom.querySelector(`[data-testid="${testId}"]`)!;
      expect(blocksIn(card), testId).toBeGreaterThan(0);
      expect(card.textContent?.includes('Đang tải'), testId).toBe(false);
      expect(card.querySelector('[role="status"]'), testId).toBeNull(); // the shell announces loading once
    }
    const regionCounts: Record<string, Record<string, number>> = {
      'rating-hero': { greeting: 1, rating: 1, tier: 1, chart: 1, tile: 3 },
      'quick-submit': { code: 1, source: 1, submit: 1, status: 1 },
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
    mockApi({ 'GET /auth/me': signedOut, 'GET /contests/r42': ok(contestDetail()) });
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
