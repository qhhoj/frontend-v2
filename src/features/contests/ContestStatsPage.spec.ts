import { afterEach, describe, expect, it, vi } from 'vitest';
import { pixelsOf, pixelsOfKind } from '@/test/bit-pixels';
import { contestPageRoutes } from '@/test/contest-routes';
import { fail, mockApi, ok } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import {
  contestDetail,
  contestProblem,
  contestStats,
  languageItem,
  problemMeta,
} from '@/test/fixtures';
import { anonymousViewer } from '@/test/problem-routes';

/** Longer than the query's first retry delay (1 s), so a retrying query would have asked again. */
const PAST_FIRST_RETRY_MS = 5_000;

describe('contest stats tab', () => {
  describe('when the statistics are not open yet', () => {
    afterEach(() => vi.useRealTimers());

    it('says so, with Bit and a way to the ranking, and does not retry', async () => {
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
      const calls = mockApi({
        ...anonymousViewer,
        ...contestPageRoutes(),
        'GET /contests/r42/stats': fail(403, 'forbidden'),
      });
      const { wrapper } = await mountApp('/contests/r42/stats');
      await vi.advanceTimersByTimeAsync(PAST_FIRST_RETRY_MS);
      expect(wrapper.get('main').text()).toContain('Thống kê chưa mở');
      const bit = wrapper.get('main [role="img"]');
      expect(pixelsOf(bit.element)).toBe(pixelsOfKind('security'));
      expect(wrapper.find('main a[href="/contests/r42/ranking"]').exists()).toBe(true);
      expect(calls.filter((call) => call.path === '/contests/r42/stats')).toHaveLength(1);
    });
  });

  it('shows solver counts per problem, with a dash where the viewer may not see them', async () => {
    const detail = contestDetail({
      problems: [contestProblem(0, { solverCount: 17 }), contestProblem(1, { solverCount: null })],
    });
    mockApi({
      ...anonymousViewer,
      ...contestPageRoutes(detail),
      'GET /problems/meta': ok(problemMeta()),
      'GET /contests/r42/stats': ok(contestStats()),
    });
    const { wrapper } = await mountApp('/contests/r42/stats');
    await vi.waitFor(() =>
      expect(wrapper.find('[data-testid="problem-results"]').exists()).toBe(true),
    );
    const rows = wrapper.findAll('[data-testid="problem-results"] tbody tr');
    const SOLVED_CELL = 2;
    expect(rows[0]!.findAll('td')[SOLVED_CELL]!.text()).toBe('17');
    expect(rows[1]!.findAll('td')[SOLVED_CELL]!.text()).toBe('—');
  });

  it('marks each language row with its own icon, resolved from the language id', async () => {
    const [cpp, python] = contestStats().languages;
    mockApi({
      ...anonymousViewer,
      ...contestPageRoutes(),
      'GET /problems/meta': ok({
        ...problemMeta(),
        languages: [
          languageItem(cpp!.languageId, 'CPP20', 'C++20'),
          languageItem(python!.languageId, 'PY3', 'Python 3'),
        ],
      }),
      'GET /contests/r42/stats': ok(contestStats()),
    });
    const { wrapper } = await mountApp('/contests/r42/stats');
    await vi.waitFor(() =>
      expect(wrapper.find('[data-testid="language-stats"] .language-mask').exists()).toBe(true),
    );
    const masks = wrapper
      .findAll('[data-testid="language-stats"] tbody th [data-testid="language-icon"]')
      .map((icon) => icon.find('.language-mask').attributes('style') ?? '');
    expect(masks).toHaveLength(2);
    expect(masks[0]).toContain('cpp.svg');
    expect(masks[1]).toContain('python.svg');
  });
});
