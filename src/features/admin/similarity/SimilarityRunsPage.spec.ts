import { describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { fail, mockApi, ok, rateLimited, sequence } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { staffViewer } from '@/test/admin-routes';
import { similarityRun } from '@/test/admin-fixtures/similarity';

const PERMS = ['judge.moss_contest'];
const runLink = (wrapper: Mounted['wrapper'], runId: string) =>
  wrapper
    .findAll('a')
    .find((link) => link.attributes('href') === `/admin/similarity?contest=hcmus-w41&run=${runId}`);
type Mounted = Awaited<ReturnType<typeof mountApp>>;
const startButton = (wrapper: Mounted['wrapper']) =>
  wrapper.findAll('button').find((button) => button.text() === 'Chạy kiểm tra tương đồng')!;

/** AdminShell and the screens load lazily: wait until the screen's own content is in the DOM. */
const mountScreen = async (path: string, isReady: (wrapper: Mounted['wrapper']) => boolean) => {
  const mounted = await mountApp(path);
  await vi.waitFor(() => {
    if (!isReady(mounted.wrapper)) throw new Error('screen not yet');
  });
  return mounted;
};
const mountScene = (path: string) =>
  mountScreen(path, (wrapper) => startButton(wrapper) !== undefined);
const start = async (wrapper: Mounted['wrapper']) => {
  await startButton(wrapper).trigger('click');
  await flushPromises();
};

describe('SimilarityRunsPage', () => {
  it('lists the scope’s runs with their status words and opens a summary from the URL', async () => {
    mockApi({
      ...staffViewer(PERMS),
      'GET /similarity/runs': ok([
        similarityRun(),
        similarityRun({ id: 'f-1', status: 'failed', error: 'deadline' }),
      ]),
      'GET /similarity/runs/run-9f02': ok(similarityRun()),
    });
    const { wrapper } = await mountScreen(
      '/admin/similarity?contest=hcmus-w41&run=run-9f02',
      (view) => view.find('[data-testid="run-summary"]').exists(),
    );
    const rows = wrapper.findAll('[data-testid="runs"] tbody tr').map((row) => row.text());
    expect(rows[0]).toContain('Xong');
    expect(rows[1]).toContain('Quá thời gian cho phép');
    expect(wrapper.get('[data-testid="run-summary"]').text()).toContain('Có nhóm bị cắt bớt.');
    expect(wrapper.get('a[href="/admin/similarity/runs/run-9f02/pairs"]').text()).toContain(
      'Xem 1.204 cặp',
    );
  });

  it('starts a run and says it was queued', async () => {
    const calls = mockApi({
      ...staffViewer(PERMS),
      'GET /similarity/runs': ok([]),
      'POST /similarity/runs': { status: 202, body: { data: { runId: 'new' } } },
    });
    const { wrapper } = await mountScene('/admin/similarity?contest=hcmus-w41');
    await start(wrapper);
    expect(calls.find((call) => call.method === 'POST')?.body).toEqual({ contest: 'hcmus-w41' });
    expect(wrapper.get('#main [role="status"]').text()).toContain('Lượt chạy mới đã vào hàng đợi.');
  });

  it('on 409 points at the run still going', async () => {
    mockApi({
      ...staffViewer(PERMS),
      'GET /similarity/runs': ok([similarityRun({ id: 'live-1', status: 'running' })]),
      'POST /similarity/runs': fail(409, 'conflict'),
    });
    const { wrapper } = await mountScene('/admin/similarity?contest=hcmus-w41');
    await start(wrapper);
    expect(wrapper.text()).toContain('Phạm vi này đang có một lượt chưa xong.');
    // jsdom's CSS engine does not match an attribute value that holds `&`, so the href is compared as text.
    const runLink = wrapper
      .findAll('a')
      .find((link) => link.attributes('href') === '/admin/similarity?contest=hcmus-w41&run=live-1');
    expect(runLink?.text()).toBe('Mở lượt đang chạy');
  });

  it('on 429 says the hourly limit and the wait the Retry-After header names, and keeps the button usable', async () => {
    mockApi({
      ...staffViewer(PERMS),
      'GET /similarity/runs': ok([]),
      'POST /similarity/runs': rateLimited(2520),
    });
    const { wrapper } = await mountScene('/admin/similarity?contest=hcmus-w41');
    await start(wrapper);
    const alert = wrapper.get('[role="alert"]').text();
    expect(alert).toContain('Tối đa 10 lượt mỗi giờ cho mỗi tài khoản.');
    expect(alert).toContain('Thử lại sau 42 phút (theo Retry-After)');
    expect(startButton(wrapper).attributes('aria-disabled')).toBeUndefined();
  });

  it('on 429 without a Retry-After header does not invent a countdown', async () => {
    mockApi({
      ...staffViewer(PERMS),
      'GET /similarity/runs': ok([]),
      'POST /similarity/runs': fail(429, 'rate_limited'),
    });
    const { wrapper } = await mountScene('/admin/similarity?contest=hcmus-w41');
    await start(wrapper);
    expect(wrapper.get('[role="alert"]').text()).toContain(
      'Tối đa 10 lượt mỗi giờ cho mỗi tài khoản. Hãy thử lại sau.',
    );
    expect(wrapper.get('[role="alert"]').text()).not.toContain('Retry-After');
  });

  it('shows the plain not-found card for a scope that does not exist or is not editable', async () => {
    mockApi({ ...staffViewer(PERMS), 'GET /similarity/runs': fail(404, 'not_found') });
    const { wrapper } = await mountScreen('/admin/similarity?contest=nope', (view) =>
      view.text().includes('Không tìm thấy'),
    );
    expect(wrapper.text()).toContain(
      'Khóa kỳ thi hoặc lượt chạy này không tồn tại, hoặc bạn không có quyền sửa.',
    );
  });

  it('on 409 refetches the list, so the run that blocks the start gets its link', async () => {
    mockApi({
      ...staffViewer(PERMS),
      'GET /similarity/runs': sequence(
        ok([]),
        ok([similarityRun({ id: 'live-1', status: 'running' })]),
      ),
      'POST /similarity/runs': fail(409, 'conflict'),
    });
    const { wrapper } = await mountScene('/admin/similarity?contest=hcmus-w41');
    await start(wrapper);
    expect(runLink(wrapper, 'live-1')?.text()).toBe('Mở lượt đang chạy');
  });

  it('a new scope drops the last start outcome, so a 429 never shows under another scope', async () => {
    mockApi({
      ...staffViewer(PERMS),
      'GET /similarity/runs': ok([]),
      'POST /similarity/runs': rateLimited(60),
    });
    const { wrapper, router } = await mountScene('/admin/similarity?contest=hcmus-w41');
    await start(wrapper);
    expect(wrapper.find('[role="alert"]').exists()).toBe(true);
    await router.push('/admin/similarity?contest=other-key');
    await flushPromises();
    expect(wrapper.find('[role="alert"]').exists()).toBe(false);
  });
});
