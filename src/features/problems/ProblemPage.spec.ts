import { flushPromises } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { useLocaleStore } from '@/stores/locale.store';
import { useSessionStore } from '@/stores/session.store';
import { contestListRoutes } from '@/test/contest-routes';
import { commentPageRoute } from '@/test/community-routes';
import {
  contestDetail,
  contestProblem,
  problemDetail,
  problemEditorial,
  sessionUser,
} from '@/test/fixtures';
import { fail, holdRequestsTo, mockApi, ok, page, sequence } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { anonymousViewer, problemPageRoutes, signedInViewer } from '@/test/problem-routes';

const editorialRoute = { 'GET /problems/duongdi/editorial': ok(problemEditorial()) };

const openProblem = async (path = '/problems/duongdi') => {
  const mounted = await mountApp(path);
  await vi.waitFor(() => expect(mounted.wrapper.find('#main h1').exists()).toBe(true));
  return mounted;
};

describe('problem page', () => {
  it('shows name, code, limits and statement text from the detail, in one landmark', async () => {
    mockApi({
      ...anonymousViewer,
      ...problemPageRoutes(problemDetail({ descriptionHtml: '<p>Thành phố có n nút</p>' })),
    });
    const { wrapper } = await openProblem();
    expect(wrapper.get('#main h1').text()).toBe('Đường đi ngắn nhất');
    const limits = wrapper.get('[data-testid="limits"]').text();
    for (const expected of ['1.0s', '256MB', '1600', '38,4%']) expect(limits).toContain(expected);
    expect(wrapper.get('.statement').text()).toContain('Thành phố có n nút');
    expect(wrapper.findAll('main')).toHaveLength(1);
  });

  it('names the tab after the problem and goes back to the section title when leaving', async () => {
    mockApi({ ...anonymousViewer, ...problemPageRoutes(), ...contestListRoutes({}) });
    const { router } = await openProblem();
    await vi.waitFor(() => expect(document.title).toBe('Đường đi ngắn nhất · QHHOJ'));
    await router.push('/contests');
    await vi.waitFor(() => expect(document.title).toBe('Kỳ thi · QHHOJ'));
  });

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

  it('shows the viewer status chip with its text for solved problems', async () => {
    mockApi({
      ...signedInViewer(),
      ...problemPageRoutes(problemDetail({ viewerStatus: 'solved' })),
    });
    const { wrapper } = await openProblem();
    expect(wrapper.get('[data-testid="viewer-status"]').text()).toContain('Đã giải');
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

  it('moves between tabs with the arrow keys and keeps exactly one tab in the tab order', async () => {
    mockApi({ ...anonymousViewer, ...problemPageRoutes(), ...editorialRoute });
    const { wrapper, router } = await openProblem();
    const tabs = () => wrapper.findAll('[role="tab"]');
    expect(tabs().filter((tab) => tab.attributes('tabindex') === '0')).toHaveLength(1);
    await tabs()[0]!.trigger('keydown', { key: 'ArrowRight' });
    await vi.waitFor(() => expect(router.currentRoute.value.query.tab).toBe('editorial'));
    expect(tabs()[1]!.attributes('aria-selected')).toBe('true');
    await tabs()[1]!.trigger('keydown', { key: 'End' });
    await vi.waitFor(() => expect(router.currentRoute.value.query.tab).toBe('submissions'));
  });

  it("does not show the previous account's viewer status after the account changes", async () => {
    const calls = mockApi({
      ...signedInViewer(),
      'GET /submissions': page([]),
      ...commentPageRoute('problem', 'duongdi'),
      'GET /problems/duongdi': sequence(
        ok(problemDetail({ viewerStatus: 'solved' })),
        ok(problemDetail({ viewerStatus: null })),
      ),
    });
    const { wrapper } = await openProblem();
    expect(wrapper.get('[data-testid="viewer-status"]').text()).toContain('Đã giải');
    useSessionStore().user = sessionUser({
      id: '0192a000-0000-7000-8000-000000000002',
      username: 'user_02',
    });
    await vi.waitFor(() =>
      expect(calls.filter((call) => call.path === '/problems/duongdi')).toHaveLength(2),
    );
    await vi.waitFor(() =>
      expect(wrapper.get('[data-testid="viewer-status"]').text()).not.toContain('Đã giải'),
    );
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

  it('shows no PDF frame for a problem without an uploaded PDF', async () => {
    mockApi({ ...anonymousViewer, ...problemPageRoutes(problemDetail({ pdfStatementUrl: null })) });
    const { wrapper } = await openProblem();
    expect(wrapper.get('[data-testid="statement-card"]').find('iframe').exists()).toBe(false);
  });

  it('changes tabs without adding history entries', async () => {
    mockApi({ ...anonymousViewer, ...problemPageRoutes(), ...editorialRoute });
    const { wrapper, router } = await openProblem();
    const push = vi.spyOn(router, 'push');
    const tabs = () => wrapper.findAll('[role="tab"]');
    await tabs()[0]!.trigger('keydown', { key: 'ArrowRight' });
    await vi.waitFor(() => expect(router.currentRoute.value.query.tab).toBe('editorial'));
    await tabs()[1]!.trigger('click');
    await tabs()[2]!.trigger('click');
    await vi.waitFor(() => expect(router.currentRoute.value.query.tab).toBe('submissions'));
    expect(push).not.toHaveBeenCalled();
  });

  it('drops an unknown ?tab= at once, also when the detail is already cached', async () => {
    mockApi({ ...anonymousViewer, ...problemPageRoutes() });
    const { router } = await openProblem();
    await router.replace('/problems/duongdi?tab=bogus');
    await vi.waitFor(() => expect(router.currentRoute.value.query.tab).toBeUndefined());
  });

  it('gives every tab a panel its aria-controls resolves to, with only the selected one shown', async () => {
    mockApi({ ...anonymousViewer, ...problemPageRoutes() });
    const { wrapper } = await openProblem();
    for (const tab of wrapper.findAll('[role="tab"]'))
      expect(wrapper.find(`#${tab.attributes('aria-controls')}`).exists()).toBe(true);
    expect(wrapper.findAll('[role="tabpanel"]:not([hidden])')).toHaveLength(1);
  });
});

describe('problem page editorial tab', () => {
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

  it('drops the tab again on a later visit when the editorial still answers 404', async () => {
    mockApi({
      ...anonymousViewer,
      ...problemPageRoutes(problemDetail()),
      ...problemPageRoutes(problemDetail({ code: 'lis', name: 'Dãy con tăng dài nhất' })),
      'GET /problems/duongdi/editorial': fail(404, 'not_found'),
    });
    const { wrapper, router } = await openProblem('/problems/duongdi?tab=editorial');
    await vi.waitFor(() => expect(router.currentRoute.value.query.tab).toBeUndefined());
    await router.push('/problems/lis');
    await vi.waitFor(() => expect(wrapper.get('#main h1').text()).toBe('Dãy con tăng dài nhất'));
    await router.push('/problems/duongdi?tab=editorial');
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

  const TWO_COLUMNS = 'lg:grid-cols-[240px_minmax(0,1fr)]';
  const layoutOf = (wrapper: Awaited<ReturnType<typeof openProblem>>['wrapper']) =>
    wrapper.get('#main > div').classes().join(' ');

  it('keeps the statement full width while the contest loads, then makes room for the rail', async () => {
    mockApi({
      ...signedInViewer(),
      ...problemPageRoutes(inContest),
      'GET /contests/r42': ok(contest),
    });
    holdRequestsTo('/contests/r42');
    const { wrapper } = await openProblem('/problems/r42b');
    expect(layoutOf(wrapper)).not.toContain(TWO_COLUMNS);
    expect(wrapper.find('[data-testid="problem-switcher"]').exists()).toBe(false);
  });

  it('opens the two-column layout once the contest has loaded', async () => {
    mockApi({
      ...signedInViewer(),
      ...problemPageRoutes(inContest),
      'GET /contests/r42': ok(contest),
    });
    const { wrapper } = await openProblem('/problems/r42b');
    await vi.waitFor(() => expect(layoutOf(wrapper)).toContain(TWO_COLUMNS));
    expect(wrapper.find('[data-testid="problem-switcher"]').exists()).toBe(true);
  });

  it('keeps the statement full width for good when the contest request fails', async () => {
    mockApi({
      ...signedInViewer(),
      ...problemPageRoutes(inContest),
      'GET /contests/r42': fail(500, 'generic'),
    });
    const { wrapper } = await openProblem('/problems/r42b');
    await flushPromises();
    expect(layoutOf(wrapper)).not.toContain(TWO_COLUMNS);
    expect(wrapper.find('[data-testid="problem-switcher"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="statement-card"]').exists()).toBe(true);
  });

  it('has no rail outside a contest and asks for no contest', async () => {
    const calls = mockApi({ ...anonymousViewer, ...problemPageRoutes() });
    const { wrapper } = await openProblem();
    await flushPromises();
    expect(wrapper.find('[data-testid="problem-switcher"]').exists()).toBe(false);
    expect(calls.some((call) => call.path.startsWith('/contests/'))).toBe(false);
  });
});
