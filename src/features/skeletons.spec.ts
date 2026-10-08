import { describe, expect, it } from 'vitest';
import { signedIn, signedOut } from '@/test/fixtures';
import { hangRequestsExcept, mockApi } from '@/test/mock-api';
import { mountApp } from '@/test/mount';

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
    expect(wrapper.findAll('table[aria-hidden="true"] [data-skeleton]').length).toBeGreaterThan(8);
  });

  it('the ranking page shows skeletons for the contest header and the board', async () => {
    mockApi({ 'GET /auth/me': signedOut });
    hangRequestsExcept(['/auth/me']);
    const { wrapper } = await mountApp('/contests/r42/ranking');
    expect(wrapper.findAll('[data-testid="query-skeleton"]').length).toBeGreaterThanOrEqual(1);
    expect(blocksIn(wrapper.element)).toBeGreaterThan(0);
  });
});
