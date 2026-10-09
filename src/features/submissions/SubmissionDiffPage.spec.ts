import { describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { loginRoutes } from '@/test/auth-routes';
import { sessionUser, submissionDetail } from '@/test/fixtures';
import { fail, hangRequestsExcept, mockApi, ok } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { anonymousViewer, signedInViewer } from '@/test/problem-routes';
import { submissionShortId } from './submission-short-id';

const LEFT = '0192a000-0000-7000-8000-00000000d001';
const RIGHT = '0192a000-0000-7000-8000-00000000d002';
const cpp = { id: 'l-cpp', key: 'CPP20', name: 'C++20' };
const py = { id: 'l-py', key: 'PY3', name: 'Python 3' };
const side = (id: string, source: string, language = cpp, username = 'user_01') => ({
  [`GET /submissions/${id}`]: ok(
    submissionDetail({ id, language, user: { id: `u-${username}`, username } }),
  ),
  [`GET /submissions/${id}/source`]: ok({ id, source }),
});
const openDiff = async (query = `?left=${LEFT}&right=${RIGHT}`) => {
  const mounted = await mountApp(`/submissions/diff${query}`);
  await flushPromises();
  return mounted;
};
const panel = (wrapper: Awaited<ReturnType<typeof openDiff>>['wrapper']) =>
  wrapper.get('[data-testid="state-panel"]');

describe('SubmissionDiffPage', () => {
  it('shows both headers and the diff of two readable sources', async () => {
    mockApi({ ...signedInViewer(), ...side(LEFT, 'a\nb\n'), ...side(RIGHT, 'a\nB\n') });
    const { wrapper } = await openDiff();
    expect(wrapper.get('h1').text()).toBe('So sánh bài nộp');
    expect(
      wrapper.findAll('[data-testid="diff-side-header"]').map((header) => header.text()),
    ).toEqual([
      expect.stringContaining(submissionShortId(LEFT)),
      expect.stringContaining(submissionShortId(RIGHT)),
    ]);
    expect(wrapper.get('[data-testid="diff-summary"]').text()).toContain('+1 dòng');
    expect(wrapper.find('[data-testid="diff-languages"]').exists()).toBe(false);
  });

  it('warns, and still compares, when the languages differ', async () => {
    mockApi({ ...signedInViewer(), ...side(LEFT, 'a'), ...side(RIGHT, 'b', py) });
    const { wrapper } = await openDiff();
    expect(wrapper.get('[data-testid="diff-languages"]').text()).toContain(
      'Trái C++20, phải Python 3.',
    );
    expect(wrapper.find('[data-testid="source-diff"]').exists()).toBe(true);
  });

  it('names the forbidden side and its author, and links to the readable side to pick again', async () => {
    mockApi({
      ...signedInViewer(),
      [`GET /submissions/${LEFT}`]: ok(
        submissionDetail({ id: LEFT, user: { id: 'u-colan', username: 'colan' } }),
      ),
      [`GET /submissions/${LEFT}/source`]: fail(403, 'solve_first'),
      ...side(RIGHT, 'b'),
    });
    const { wrapper } = await openDiff();
    expect(panel(wrapper).attributes('data-state')).toBe('forbidden');
    expect(panel(wrapper).text()).toContain(
      `Không xem được bài nộp ${submissionShortId(LEFT)} của colan`,
    );
    expect(panel(wrapper).get('a').attributes('href')).toBe(`/submissions/${RIGHT}`);
    expect(wrapper.find('[data-testid="source-diff"]').exists()).toBe(false);
  });

  it('tells the viewer the other side is still theirs when it is', async () => {
    mockApi({
      ...signedInViewer(),
      [`GET /submissions/${LEFT}`]: ok(
        submissionDetail({ id: LEFT, user: { id: 'u-colan', username: 'colan' } }),
      ),
      [`GET /submissions/${LEFT}/source`]: fail(403, 'solve_first'),
      [`GET /submissions/${RIGHT}`]: ok(
        submissionDetail({ id: RIGHT, user: { id: sessionUser().id, username: 'user_01' } }),
      ),
      [`GET /submissions/${RIGHT}/source`]: ok({ id: RIGHT, source: 'b' }),
    });
    const { wrapper } = await openDiff();
    expect(panel(wrapper).text()).toContain(
      `(cạnh trái). Bên phải ${submissionShortId(RIGHT)} vẫn là của bạn.`,
    );
  });

  it('names only the id when the detail itself is forbidden', async () => {
    mockApi({
      ...signedInViewer(),
      [`GET /submissions/${LEFT}`]: fail(403, 'forbidden'),
      [`GET /submissions/${LEFT}/source`]: fail(403, 'forbidden'),
      ...side(RIGHT, 'b'),
    });
    const { wrapper } = await openDiff();
    expect(panel(wrapper).text()).toContain(`Không xem được bài nộp ${submissionShortId(LEFT)}`);
    expect(panel(wrapper).text()).not.toMatch(/bài nộp \S+ của /);
  });

  it('shows the crying 404 state for a missing side', async () => {
    mockApi({
      ...signedInViewer(),
      [`GET /submissions/${LEFT}`]: fail(404, 'not_found'),
      [`GET /submissions/${LEFT}/source`]: fail(404, 'not_found'),
      ...side(RIGHT, 'b'),
    });
    const { wrapper } = await openDiff();
    expect(panel(wrapper).attributes('data-state')).toBe('notFound');
  });

  it('says the sources are identical, with the crown Bit', async () => {
    mockApi({ ...signedInViewer(), ...side(LEFT, 'a\r\nb\r\n'), ...side(RIGHT, 'a\nb') });
    const { wrapper } = await openDiff();
    expect(panel(wrapper).attributes('data-state')).toBe('success');
    expect(panel(wrapper).text()).toContain('Hai mã nguồn giống hệt nhau');
  });

  it('refuses above 5 000 lines and names the count', async () => {
    const long = Array.from({ length: 6240 }, (_unused, index) => `x${index}`).join('\n');
    mockApi({ ...signedInViewer(), ...side(LEFT, 'a'), ...side(RIGHT, long) });
    const { wrapper } = await openDiff();
    expect(panel(wrapper).text()).toContain('Một bên có 6.240 dòng, vượt giới hạn 5.000 dòng.');
  });

  it('answers promptly with a notice when two large sources share almost nothing', async () => {
    const source = (prefix: string) =>
      Array.from({ length: 4000 }, (_unused, index) => `${prefix}${index}`).join('\n');
    mockApi({ ...signedInViewer(), ...side(LEFT, source('p')), ...side(RIGHT, source('q')) });
    const started = performance.now();
    const { wrapper } = await openDiff();
    expect(performance.now() - started).toBeLessThan(3000);
    expect(panel(wrapper).text()).toContain('khác nhau hơn 1.000 dòng');
    expect(wrapper.find('[data-testid="source-diff"]').exists()).toBe(false);
  });

  it('retries a failed side', async () => {
    let attempts = 0;
    mockApi({
      ...signedInViewer(),
      ...side(LEFT, 'a'),
      [`GET /submissions/${RIGHT}`]: ok(submissionDetail({ id: RIGHT })),
      [`GET /submissions/${RIGHT}/source`]: () =>
        (attempts += 1) === 1
          ? { status: 500, body: { error: { code: 'generic', message: 'x' } } }
          : ok({ id: RIGHT, source: 'b' }),
    });
    const { wrapper } = await openDiff();
    expect(panel(wrapper).attributes('data-state')).toBe('error');
    await panel(wrapper).get('button').trigger('click');
    await flushPromises();
    expect(wrapper.find('[data-testid="source-diff"]').exists()).toBe(true);
  });

  it.each([
    ['no ids', ''],
    ['one id', `?left=${LEFT}`],
    ['the same id twice', `?left=${LEFT}&right=${LEFT}`],
    ['a bad id', `?left=a%20b&right=${RIGHT}`],
  ])(
    'asks to pick two submissions for %s, and asks the API nothing about submissions',
    async (_name, query) => {
      const calls = mockApi({ ...signedInViewer() });
      const { wrapper } = await openDiff(query);
      expect(panel(wrapper).attributes('data-state')).toBe('empty');
      expect(calls.some((call) => call.path.startsWith('/submissions'))).toBe(false);
    },
  );

  it('shows skeleton blocks shaped like the diff while loading', async () => {
    mockApi({ ...signedInViewer() });
    hangRequestsExcept(['/auth/me', '/profile']);
    const { wrapper } = await openDiff();
    expect(wrapper.findAll('[data-skeleton-region="diff-line"]').length).toBeGreaterThan(5);
  });

  it('sends a signed-out viewer to sign in', async () => {
    mockApi({ ...anonymousViewer, ...loginRoutes });
    const { router } = await openDiff();
    await vi.waitFor(() => expect(router.currentRoute.value.name).toBe('login'));
  });
});
