import { flushPromises } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { confirmDialog, staffViewer, STAFF_ID } from '@/test/admin-routes';
import { mountAndWaitFor } from '@/test/admin-contest-mount';
import { contestEditorRoutes, editableContest } from '@/test/admin-fixtures/contests';
import { contestExportStatus, feedKeyStatus, mintedFeedKey } from '@/test/contest-extras-fixtures';
import { profile, sessionUser, signedIn } from '@/test/fixtures';
import { fail, mockApi, noContent, ok, sequence } from '@/test/mock-api';

const EDIT = ['judge.edit_own_contest'];
const TITLE = 'Nguồn sự kiện cho công cụ công bố kết quả';
const ended = editableContest({ phase: 'ended' });
const routes = (extra = {}, contest = ended) => ({
  ...staffViewer(EDIT),
  ...contestEditorRoutes(contest),
  'GET /contests/hcmus-w41/export': ok(contestExportStatus()),
  'GET /contests/hcmus-w41/feed-key': ok(
    feedKeyStatus({ isActive: false, mode: null, expiresAt: null, createdBy: null }),
  ),
  ...extra,
});
type Mounted = Awaited<ReturnType<typeof mountAndWaitFor>>;
const press = async (wrapper: Mounted['wrapper'], text: string) => {
  await wrapper
    .findAll('button')
    .find((button) => button.text() === text)!
    .trigger('click');
  await flushPromises();
};
const dialogText = () => document.body.querySelector('[role="dialog"]')?.textContent ?? '';

describe('contest data tab', () => {
  afterEach(() => vi.useRealTimers());

  it('mints a key, shows it once with the feed addresses, and forgets it when the dialog closes', async () => {
    const minted = mintedFeedKey();
    mockApi(
      routes({
        'POST /contests/hcmus-w41/feed-key': ok(minted),
        'GET /contests/hcmus-w41/feed-key': sequence(
          ok(feedKeyStatus({ isActive: false, mode: null, expiresAt: null, createdBy: null })),
          ok(feedKeyStatus()),
        ),
      }),
    );
    const { wrapper, queryClient } = await mountAndWaitFor('/admin/contests/hcmus-w41/data', TITLE);
    await press(wrapper, 'Tạo khóa');
    await confirmDialog('Tạo khóa');
    await vi.waitFor(() => expect(dialogText()).toContain(minted.key));
    expect(dialogText()).toContain('/api/internal/contests/hcmus-w41/feed');
    expect(dialogText()).toContain('/api/internal/events/contests/hcmus-w41/feed');
    const cached = JSON.stringify(
      queryClient
        .getQueryCache()
        .getAll()
        .map((query) => query.state.data),
    );
    expect(cached).not.toContain(minted.key);
    await confirmDialog('Tôi đã lưu khóa');
    expect(document.body.textContent).not.toContain(minted.key);
  });

  it('sends the chosen mode and days', async () => {
    const calls = mockApi(
      routes({ 'POST /contests/hcmus-w41/feed-key': ok(mintedFeedKey({ mode: 'live' })) }),
    );
    const { wrapper } = await mountAndWaitFor('/admin/contests/hcmus-w41/data', TITLE);
    await wrapper.get('input[value="live"]').setValue(true);
    await wrapper.get('input[type="number"]').setValue(3);
    await press(wrapper, 'Tạo khóa');
    await confirmDialog('Tạo khóa');
    expect(calls.filter((call) => call.method === 'POST').map((call) => call.body)).toEqual([
      { mode: 'live', expiresInDays: 3 },
    ]);
  });

  it('offers the release only during a freeze, and maps not_frozen', async () => {
    vi.useFakeTimers({ now: Date.parse('2026-10-08T09:30:00.000Z'), toFake: ['Date'] });
    mockApi(
      routes(
        {
          'GET /contests/hcmus-w41/feed-key': ok(feedKeyStatus()),
          'POST /contests/hcmus-w41/feed-key/release': fail(409, 'not_frozen'),
        },
        editableContest({ phase: 'running' }),
      ),
    );
    const { wrapper } = await mountAndWaitFor('/admin/contests/hcmus-w41/data', TITLE);
    await press(wrapper, 'Mở cho công cụ công bố');
    await confirmDialog('Mở');
    expect(document.body.querySelector('[role="dialog"] [role="alert"]')!.textContent).toContain(
      'Bảng xếp hạng không đóng băng',
    );
  });

  it('hides the release before the freeze and for a live key', async () => {
    vi.useFakeTimers({ now: Date.parse('2026-10-08T07:00:00.000Z'), toFake: ['Date'] });
    mockApi(
      routes(
        { 'GET /contests/hcmus-w41/feed-key': ok(feedKeyStatus()) },
        editableContest({ phase: 'running' }),
      ),
    );
    const { wrapper } = await mountAndWaitFor('/admin/contests/hcmus-w41/data', TITLE);
    expect(
      wrapper.findAll('button').some((button) => button.text() === 'Mở cho công cụ công bố'),
    ).toBe(false);
  });

  it('offers no key controls while impersonating', async () => {
    mockApi({
      ...routes(),
      'GET /auth/me': signedIn({
        user: sessionUser({ id: STAFF_ID, username: 'minhthu', isStaff: true, permissions: EDIT }),
        impersonatorId: 'admin-1',
      }),
      'GET /profile': ok(profile()),
    });
    const { wrapper } = await mountAndWaitFor('/admin/contests/hcmus-w41/data', TITLE);
    expect(wrapper.text()).toContain('Đang xem với tư cách người khác');
    expect(wrapper.findAll('button').some((button) => button.text() === 'Tạo khóa')).toBe(false);
  });

  it('revokes only after the confirm', async () => {
    const calls = mockApi(
      routes({
        'GET /contests/hcmus-w41/feed-key': ok(feedKeyStatus()),
        'DELETE /contests/hcmus-w41/feed-key': noContent(),
      }),
    );
    const { wrapper } = await mountAndWaitFor('/admin/contests/hcmus-w41/data', TITLE);
    await press(wrapper, 'Thu hồi khóa');
    expect(calls.filter((call) => call.method === 'DELETE')).toHaveLength(0);
    await confirmDialog('Thu hồi');
    expect(calls.filter((call) => call.method === 'DELETE')).toHaveLength(1);
  });

  it('prepares the export once and links the ready zip; a missing export root says so', async () => {
    const calls = mockApi(
      routes({
        'GET /contests/hcmus-w41/export': ok(
          contestExportStatus({ state: 'none', size: null, readyAt: null, nextPrepareAt: null }),
        ),
        'POST /contests/hcmus-w41/export': { status: 202, body: { data: { queued: true } } },
      }),
    );
    const { wrapper } = await mountAndWaitFor('/admin/contests/hcmus-w41/data', TITLE);
    await press(wrapper, 'Tạo bản xuất');
    expect(
      calls.filter((call) => call.method === 'POST' && call.path.endsWith('/export')),
    ).toHaveLength(1);
    wrapper.unmount();
    mockApi(routes({ 'GET /contests/hcmus-w41/export': fail(404, 'not_found') }));
    const second = await mountAndWaitFor('/admin/contests/hcmus-w41/data', TITLE);
    expect(second.wrapper.get('[data-testid="export-card"]').text()).toContain('chưa cấu hình');
  });

  it('keeps the export card quiet before the end and asks nothing', async () => {
    const calls = mockApi(routes({}, editableContest({ phase: 'running' })));
    const { wrapper } = await mountAndWaitFor('/admin/contests/hcmus-w41/data', TITLE);
    expect(wrapper.get('[data-testid="export-card"]').text()).toContain(
      'Xuất được sau khi kỳ thi kết thúc.',
    );
    expect(calls.some((call) => call.path === '/contests/hcmus-w41/export')).toBe(false);
  });
});
