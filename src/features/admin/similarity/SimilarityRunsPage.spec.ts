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
  it('on 429 says the hourly limit and the wait the Retry-After header names, and keeps the button usable', async () => {
    mockApi({
      ...staffViewer(PERMS),
      'GET /similarity/runs': ok([]),
      'POST /similarity/runs': rateLimited(2520),
    });
    const { wrapper } = await mountScene('/admin/similarity?contest=hcmus-w41');
    await start(wrapper);
    const alert = wrapper.get('[role="alert"]').text();
    expect(alert).toContain('tối đa 10 lượt mỗi giờ cho mỗi tài khoản.');
    expect(alert).toContain('Thử lại sau 42 phút.');
    expect(alert).not.toContain('429');
    expect(startButton(wrapper).attributes('aria-disabled')).toBeUndefined();
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
