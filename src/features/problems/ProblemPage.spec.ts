import { flushPromises } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { useLocaleStore } from '@/stores/locale.store';
import {
  contestDetail,
  contestProblem,
  participationSummary,
  problemDetail,
  problemEditorial,
  submissionItem,
  viewerResult,
} from '@/test/fixtures';
import { fail, mockApi, ok, page, sequence } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { anonymousViewer, problemPageRoutes, signedInViewer } from '@/test/problem-routes';

const openProblem = async (path = '/problems/duongdi') => {
  const mounted = await mountApp(path);
  await vi.waitFor(() => expect(mounted.wrapper.find('#main h1').exists()).toBe(true));
  return mounted;
};

describe('problem page', () => {
  it('sends the UI locale as statement language and refetches when it changes', async () => {
    const calls = mockApi({ ...anonymousViewer, ...problemPageRoutes() });
    const { wrapper } = await openProblem();
    useLocaleStore().toggle();
    await vi.waitFor(() =>
      expect(
        calls
          .filter((call) => call.path === '/problems/duongdi')
          .map((call) => call.query.get('lang')),
      ).toEqual(['vi', 'en']),
    );
    expect(wrapper.find('#main h1').exists()).toBe(true); // the old statement stays while the other language loads
  });

  it('never shows another problem under the new address while it loads', async () => {
    mockApi({
      ...anonymousViewer,
      ...problemPageRoutes(problemDetail({ code: 'duongdi' })),
      ...problemPageRoutes(problemDetail({ code: 'lis', name: 'Dãy con tăng dài nhất' })),
    });
    const { wrapper, router } = await openProblem('/problems/duongdi');
    const answer = globalThis.fetch;
    vi.stubGlobal('fetch', (input: string, init?: RequestInit) =>
      String(input).includes('/problems/lis')
        ? new Promise<Response>(() => {})
        : answer(input, init),
    );
    await router.push('/problems/lis');
    await flushPromises();
    expect(wrapper.text()).not.toContain('Đường đi ngắn nhất');
    expect(wrapper.find('[data-testid="query-skeleton"]').exists()).toBe(true);
  });

  it('hides the editorial tab when the backend says there is none (contest) and drops ?tab=editorial', async () => {
    mockApi({ ...anonymousViewer, ...problemPageRoutes(problemDetail({ hasEditorial: false })) });
    const { wrapper, router } = await openProblem('/problems/duongdi?tab=editorial');
    expect(wrapper.findAll('[role="tab"]').map((tab) => tab.text())).not.toContain('Lời giải');
    await vi.waitFor(() => expect(router.currentRoute.value.query.tab).toBeUndefined());
    expect(wrapper.find('.statement').exists()).toBe(true);
  });

  it('renders the not-found page in place for a 404, whatever the reason', async () => {
    mockApi({
      ...anonymousViewer,
      'GET /problems/ghost': { status: 404, body: { error: { code: 'not_found', message: 'x' } } },
    });
    const { wrapper, router } = await mountApp('/problems/ghost');
    await vi.waitFor(() => expect(wrapper.find('[data-testid="pale-404"]').exists()).toBe(true));
    expect(router.currentRoute.value.path).toBe('/problems/ghost');
  });

  it('links all submissions and the best-submissions ranking of the problem', async () => {
    mockApi({ ...anonymousViewer, ...problemPageRoutes() });
    const { wrapper } = await openProblem();
    expect(wrapper.get('[data-testid="all-submissions-link"]').attributes('href')).toBe(
      '/submissions?problem=duongdi',
    );
    expect(wrapper.get('[data-testid="best-submissions-link"]').attributes('href')).toBe(
      '/problems/duongdi/best',
    );
    expect(wrapper.find('[data-testid="my-submissions-link"]').exists()).toBe(false);
  });

  it("links a signed-in viewer's own submissions of the problem", async () => {
    mockApi({ ...signedInViewer(), ...problemPageRoutes() });
    const { wrapper } = await openProblem();
    await vi.waitFor(() =>
      expect(wrapper.find('[data-testid="my-submissions-link"]').exists()).toBe(true),
    );
    expect(wrapper.get('[data-testid="my-submissions-link"]').attributes('href')).toBe(
      '/submissions?problem=duongdi&user=user_01',
    );
  });

  it('offers one PDF control: the uploaded statement when there is one', async () => {
    mockApi({
      ...anonymousViewer,
      ...problemPageRoutes(problemDetail({ pdfStatementUrl: '/pdf/a.pdf' })),
    });
    const { wrapper } = await openProblem();
    const link = wrapper.get('[data-testid="pdf-statement-link"]');
    expect(link.attributes('href')).toBe('/pdf/a.pdf');
    expect(link.attributes('aria-label')).toBe('Đề bài PDF');
    expect(link.text()).toBe('PDF');
    expect(wrapper.find('[data-testid="pdf-button"]').exists()).toBe(false);
  });

  it('offers no rendered PDF when the statement is only an uploaded PDF', async () => {
    mockApi({
      ...anonymousViewer,
      ...problemPageRoutes(problemDetail({ descriptionHtml: ' ', pdfStatementUrl: '/pdf/a.pdf' })),
    });
    const { wrapper } = await openProblem();
    expect(wrapper.find('[data-testid="header-actions"] button').exists()).toBe(false);
  });

  it('offers the rendered PDF for a text statement without an uploaded PDF', async () => {
    mockApi({ ...anonymousViewer, ...problemPageRoutes(problemDetail({ pdfStatementUrl: null })) });
    const { wrapper } = await openProblem();
    expect(wrapper.get('[data-testid="pdf-button"]').attributes('aria-label')).toBe(
      'Tải đề dạng PDF',
    );
  });

  it('shows the uploaded PDF statement inside the statement card', async () => {
    mockApi({
      ...anonymousViewer,
      ...problemPageRoutes(problemDetail({ descriptionHtml: '', pdfStatementUrl: '/pdf/a.pdf' })),
    });
    const { wrapper } = await openProblem();
    const card = wrapper.get('[data-testid="statement-card"]');
    expect(card.get('iframe').attributes('src')).toBe('/pdf/a.pdf');
  });

  it('drops an unknown ?tab= at once, also when the detail is already cached', async () => {
    mockApi({ ...anonymousViewer, ...problemPageRoutes() });
    const { router } = await openProblem();
    await router.replace('/problems/duongdi?tab=bogus');
    await vi.waitFor(() => expect(router.currentRoute.value.query.tab).toBeUndefined());
  });
});

describe('problem page editorial tab', () => {
  it('flags an editorial that only editors can see', async () => {
    mockApi({
      ...anonymousViewer,
      ...problemPageRoutes(problemDetail()),
      'GET /problems/duongdi/editorial': ok(problemEditorial({ isPublic: false })),
    });
    const { wrapper } = await mountApp('/problems/duongdi?tab=editorial');
    await vi.waitFor(() => expect(wrapper.text()).toContain('Chỉ người chỉnh sửa thấy'));
  });

  it('drops the tab on a revisit when the cached editorial already holds a 404 after an earlier success', async () => {
    mockApi({
      ...anonymousViewer,
      ...problemPageRoutes(),
      'GET /problems/duongdi/editorial': sequence(ok(problemEditorial()), fail(404, 'not_found')),
    });
    const { wrapper, router, queryClient } = await openProblem('/problems/duongdi?tab=editorial');
    await vi.waitFor(() => expect(wrapper.find('.user-content').exists()).toBe(true));
    await router.replace({ query: {} });
    // A refetch while the tab is unmounted leaves the cache with the old editorial and an error.
    await queryClient.refetchQueries({ queryKey: ['problems', 'editorial'] });
    await router.replace({ query: { tab: 'editorial' } });
    await vi.waitFor(() =>
      expect(wrapper.findAll('[role="tab"]').map((tab) => tab.text())).not.toContain('Lời giải'),
    );
    await vi.waitFor(() => expect(router.currentRoute.value.query.tab).toBeUndefined());
  });

  it('does not ask for the editorial while the statement tab is active', async () => {
    const calls = mockApi({ ...anonymousViewer, ...problemPageRoutes() });
    await openProblem('/problems/duongdi');
    expect(calls.some((call) => call.path.endsWith('/editorial'))).toBe(false);
  });

  it('drops the tab and ?tab= with replace (no history entry) when the editorial answers 404', async () => {
    mockApi({
      ...anonymousViewer,
      ...problemPageRoutes(),
      'GET /problems/duongdi/editorial': fail(404, 'not_found'),
    });
    // Hold the 404 until the spies are in place, so every navigation the gone answer causes is seen.
    const answer = globalThis.fetch;
    let releaseAnswer = () => {};
    vi.stubGlobal('fetch', (input: string, init?: RequestInit) =>
      String(input).includes('/editorial')
        ? new Promise<Response>((resolve) => {
            releaseAnswer = () => resolve(answer(input, init));
          })
        : answer(input, init),
    );
    const { wrapper, router } = await openProblem('/problems/duongdi?tab=editorial');
    const push = vi.spyOn(router, 'push');
    const replace = vi.spyOn(router, 'replace');
    releaseAnswer();
    await vi.waitFor(() =>
      expect(wrapper.findAll('[role="tab"]').map((tab) => tab.text())).not.toContain('Lời giải'),
    );
    await vi.waitFor(() => expect(router.currentRoute.value.query.tab).toBeUndefined());
    expect(wrapper.find('.statement').exists()).toBe(true);
    expect(replace).toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });
});

describe('problem page inside a contest', () => {
  const inContest = problemDetail({
    code: 'r42b',
    contest: { contestKey: 'r42', attemptsLeft: null },
  });
  const contest = contestDetail({
    problems: [contestProblem(0), contestProblem(1), contestProblem(2)],
  });

  it('shows the contest problem rail with the open problem current', async () => {
    mockApi({
      ...signedInViewer(),
      ...problemPageRoutes(inContest),
      'GET /contests/r42': ok(contest),
    });
    const { wrapper } = await openProblem('/problems/r42b');
    await vi.waitFor(() =>
      expect(wrapper.find('[data-testid="problem-switcher"] [aria-current="page"]').exists()).toBe(
        true,
      ),
    );
    const current = wrapper.get('[data-testid="problem-switcher"] [aria-current="page"]');
    expect(current.attributes('href')).toBe('/problems/r42b');
  });

  it('carries the contest bar, lights "Kỳ thi" and trades site-wide facts for the contest ones', async () => {
    const solved = contestDetail({
      problems: [
        contestProblem(0),
        contestProblem(1, {
          points: 250,
          viewerResult: viewerResult({
            isSolved: true,
            attempts: 1,
            cell: { points: 250, time: 3038 },
          }),
        }),
      ],
    });
    mockApi({
      ...signedInViewer(),
      ...problemPageRoutes(inContest),
      'GET /contests/r42': ok(solved),
      'GET /contests/r42/announcements': page([]),
      // A submission made in the contest scores its own contest points in the rail.
      'GET /submissions': page([
        submissionItem({
          points: 1600,
          contest: { key: 'r42', name: solved.name, points: 250, minute: 12 },
        }),
      ]),
      'GET /contests/current': ok({
        contest: {
          key: 'r42',
          name: solved.name,
          startTime: solved.startTime,
          endTime: '2999-01-01T00:00:00Z',
        },
        participation: participationSummary({ endTime: '2999-01-01T00:00:00Z' }),
      }),
    });
    const { wrapper } = await openProblem('/problems/r42b');
    await vi.waitFor(() => expect(wrapper.find('[data-testid="contest-bar"]').exists()).toBe(true));
    const bar = wrapper.get('[data-testid="contest-bar"]');
    expect(bar.text()).toContain(`Bạn đang thi · ${solved.name}`);
    expect(bar.get('[aria-current="page"]').attributes('href')).toBe('/contests/r42');
    const nav = wrapper.get('header nav[aria-label]');
    expect(nav.get('[aria-current="page"]').text()).toBe('Kỳ thi');
    await vi.waitFor(() =>
      expect(wrapper.find('[data-testid="viewer-own-result"]').exists()).toBe(true),
    );
    const facts = wrapper.get('[data-testid="problem-facts"]').text();
    expect(facts).toContain('Điểm kỳ thi250');
    expect(facts).not.toContain('Tỉ lệ AC');
    const strip = wrapper.get('[data-testid="problem-limit-strip"]');
    expect(strip.text()).toContain('250');
    expect(strip.find('[data-testid="strip-own-result"]').exists()).toBe(true);
    expect(strip.find('[data-testid="strip-status"]').exists()).toBe(false);
    expect(strip.text()).not.toContain('người giải');
    expect(wrapper.get('[data-testid="rail-my-submissions"]').text()).toContain(
      '250 / 250 điểm kỳ thi',
    );
    await wrapper.get('[data-testid="rail-submit"] button').trigger('click');
    await flushPromises();
    expect(wrapper.get('[data-testid="submit-contest"]').text()).toContain(
      `Kỳ thi: ${solved.name}`,
    );
  });

  it('has no rail outside a contest and asks for no contest', async () => {
    const calls = mockApi({ ...anonymousViewer, ...problemPageRoutes() });
    const { wrapper } = await openProblem();
    await flushPromises();
    expect(wrapper.find('[data-testid="problem-switcher"]').exists()).toBe(false);
    expect(calls.some((call) => call.path.startsWith('/contests/'))).toBe(false);
  });
});
