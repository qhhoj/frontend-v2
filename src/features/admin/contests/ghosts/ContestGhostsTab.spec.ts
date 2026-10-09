import { baseCompile } from '@intlify/message-compiler';

import { flushPromises } from '@vue/test-utils';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { confirmDialog, staffViewer, switchNamed } from '@/test/admin-routes';
import { contestEditorRoutes, editableContest } from '@/test/admin-fixtures/contests';
import { ghost, GHOST_CSV, unrankedGhost } from '@/test/admin-fixtures/ghosts';
import { mountAndWaitFor } from '@/test/admin-contest-mount';
import { i18n } from '@/i18n';
import { fail, issue, mockApi, noContent, ok, sequence } from '@/test/mock-api';
import type { ApiCall, MockHandler } from '@/test/mock-api';
import type { mountApp } from '@/test/mount';

type Wrapper = Awaited<ReturnType<typeof mountApp>>['wrapper'];
const EDIT = ['judge.edit_own_contest'];
const LIST = 'GET /contests/hcmus-w41/ghosts';
const PUT = 'PUT /contests/hcmus-w41/ghosts';
const PATH = '/admin/contests/hcmus-w41/ghosts';

beforeAll(() => {
  if (!('text' in File.prototype))
    Object.defineProperty(File.prototype, 'text', {
      configurable: true,
      writable: true,
      value(this: Blob) {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsText(this);
        });
      },
    });
});

const routes = (overrides: Record<string, MockHandler> = {}) => ({
  ...staffViewer(EDIT),
  ...contestEditorRoutes(),
  [LIST]: ok({ ghosts: [ghost(), unrankedGhost()] }),
  ...overrides,
});
const buttonNamed = (wrapper: Wrapper, name: string) =>
  wrapper.findAll('button').find((button) => button.text() === name)!;
const click = async (wrapper: Wrapper, name: string) => {
  await buttonNamed(wrapper, name).trigger('click');
  await flushPromises();
};
async function pickCsv(wrapper: Wrapper, text = GHOST_CSV) {
  const input = wrapper.get('[data-testid="ghost-csv"] input');
  Object.defineProperty(input.element, 'files', {
    value: [new File([text], 'hsg-2024.csv', { type: 'text/csv' })],
    configurable: true,
  });
  await input.trigger('change');
  await flushPromises();
}
const puts = (calls: ApiCall[]) =>
  calls.filter((call) => call.method === 'PUT' && call.path.endsWith('/ghosts'));

describe('ContestGhostsTab', () => {
  it("lists the current set with each row's status and links the CSV download", async () => {
    mockApi(routes());
    const { wrapper } = await mountAndWaitFor(PATH, 'Bộ ghost hiện tại');
    const current = wrapper.get('[data-testid="ghost-current"]');
    expect(current.text()).toContain('2 ghost');
    expect(
      current.findAll('tbody tr').map((row) => row.findAll('td').map((cell) => cell.text())),
    ).toEqual([
      ['Ann', 'THPT A', '1', 'Xếp hạng'],
      ['Bob', 'THPT B', '1', 'Không đủ dữ liệu: thiếu số lần sai'],
    ]);
    const download = current.get('a[download]');
    expect(download.attributes('href')).toBe('/api/internal/contests/hcmus-w41/ghosts/csv');
  });

  it('previews the file with the anonymise choice, stores nothing, and lists the unranked rows', async () => {
    const calls = mockApi(
      routes({
        [PUT]: ok({
          stored: false,
          ghosts: [ghost({ label: 'Ghost 001' }), unrankedGhost({ label: 'Ghost 002' })],
        }),
      }),
    );
    const { wrapper } = await mountAndWaitFor(PATH, 'Nhập ghost từ CSV');
    expect(buttonNamed(wrapper, 'Thay thế bộ ghost').attributes('aria-disabled')).toBe('true');
    await pickCsv(wrapper);
    await switchNamed(wrapper, 'Ẩn danh tên').trigger('click');
    await click(wrapper, 'Xem trước');
    expect(puts(calls).map((call) => call.body)).toEqual([
      { csv: GHOST_CSV, anonymize: true, dryRun: true },
    ]);
    const importCard = wrapper.get('[data-testid="ghost-import"]');
    expect(importCard.text()).toContain('Xem trước · 2 ghost');
    expect(importCard.text()).toContain('1 dòng không đủ dữ liệu, sẽ xếp cuối:');
    expect(importCard.text()).toContain('Ghost 002 — Không đủ dữ liệu: thiếu số lần sai');
    expect(buttonNamed(wrapper, 'Thay thế bộ ghost').attributes('aria-disabled')).toBe('false');
  });

  it('ignores a click on replace until the file was previewed', async () => {
    const calls = mockApi(routes({ [PUT]: ok({ stored: true, ghosts: [ghost()] }) }));
    const { wrapper } = await mountAndWaitFor(PATH, 'Nhập ghost từ CSV');
    await pickCsv(wrapper);
    await click(wrapper, 'Thay thế bộ ghost');
    expect(document.body.querySelector('[role="dialog"]')).toBeNull();
    expect(puts(calls)).toHaveLength(0);
  });

  it('sends one preview for a double click', async () => {
    const calls = mockApi(routes({ [PUT]: ok({ stored: false, ghosts: [ghost()] }) }));
    const { wrapper } = await mountAndWaitFor(PATH, 'Nhập ghost từ CSV');
    await pickCsv(wrapper);
    const preview = buttonNamed(wrapper, 'Xem trước');
    await Promise.all([preview.trigger('click'), preview.trigger('click')]);
    await flushPromises();
    expect(puts(calls)).toHaveLength(1);
  });

  it('asks before replacing an existing set, offers its CSV first, then stores and re-reads the list', async () => {
    const calls = mockApi(
      routes({
        [LIST]: sequence(
          ok({ ghosts: [ghost(), unrankedGhost()] }),
          ok({ ghosts: [ghost({ label: 'Cy' })] }),
        ),
        [PUT]: (call) =>
          ok({
            stored: !(call.body as { dryRun: boolean }).dryRun,
            ghosts: [ghost({ label: 'Cy' })],
          }),
      }),
    );
    const { wrapper } = await mountAndWaitFor(PATH, 'Nhập ghost từ CSV');
    await pickCsv(wrapper);
    await click(wrapper, 'Xem trước');
    await click(wrapper, 'Thay thế bộ ghost');
    const dialog = document.body.querySelector('[role="dialog"]')!;
    expect(dialog.textContent).toContain('Thay thế 2 ghost hiện có?');
    expect(dialog.querySelector('a[download]')?.getAttribute('href')).toBe(
      '/api/internal/contests/hcmus-w41/ghosts/csv',
    );
    expect(puts(calls)).toHaveLength(1);
    await confirmDialog('Thay thế');
    expect(puts(calls).map((call) => (call.body as { dryRun: boolean }).dryRun)).toEqual([
      true,
      false,
    ]);
    expect(
      calls.filter((call) => call.method === 'GET' && call.path.endsWith('/ghosts')),
    ).toHaveLength(2);
    expect(wrapper.text()).toContain('Đã lưu 1 ghost. Bản phát lại sẽ được dựng lại.');
  });

  it('replaces an empty set without asking', async () => {
    const calls = mockApi(
      routes({
        [LIST]: ok({ ghosts: [] }),
        [PUT]: (call) =>
          ok({ stored: !(call.body as { dryRun: boolean }).dryRun, ghosts: [ghost()] }),
      }),
    );
    const { wrapper } = await mountAndWaitFor(PATH, 'Chưa có ghost nào.');
    await pickCsv(wrapper);
    await click(wrapper, 'Xem trước');
    await click(wrapper, 'Thay thế bộ ghost');
    expect(document.body.querySelector('[role="dialog"]')).toBeNull();
    expect(puts(calls)).toHaveLength(2);
  });

  it('lists every refused row with Bit, and keeps the current set', async () => {
    const rows = ['Dòng 2: Nhãn bắt đầu bằng = + - hoặc @.', 'Dòng 3: Ô điểm không đúng cú pháp.'];
    const issues = [
      { ...issue('csv', 'label_formula', 'x'), row: 2 },
      { ...issue('csv', 'cell_invalid', 'x'), row: 3 },
    ];
    mockApi(routes({ [PUT]: fail(400, 'ghost_import_invalid', undefined, issues) }));
    const { wrapper } = await mountAndWaitFor(PATH, 'Nhập ghost từ CSV');
    await pickCsv(wrapper, 'label,caption\n=cmd,,1');
    await click(wrapper, 'Xem trước');
    const alert = wrapper.get('[data-testid="ghost-import"] [role="alert"]');
    expect(alert.findAll('li').map((item) => item.text())).toEqual(rows);
    expect(alert.find('[data-placement="refused"]').exists()).toBe(true);
    expect(wrapper.get('[data-testid="ghost-current"]').text()).toContain('2 ghost');
  });

  it('deletes the set only after confirming', async () => {
    const calls = mockApi(
      routes({
        [LIST]: sequence(ok({ ghosts: [ghost()] }), ok({ ghosts: [] })),
        'DELETE /contests/hcmus-w41/ghosts': noContent(),
      }),
    );
    const { wrapper } = await mountAndWaitFor(PATH, 'Bộ ghost hiện tại');
    await click(wrapper, 'Xóa bộ ghost');
    expect(calls.some((call) => call.method === 'DELETE')).toBe(false);
    await confirmDialog('Xóa');
    expect(calls.some((call) => call.method === 'DELETE')).toBe(true);
    expect(wrapper.text()).toContain('Đã xóa bộ ghost.');
    expect(wrapper.text()).toContain('Chưa có ghost nào.');
  });

  it('says a final-submission contest has no ghosts and asks for none', async () => {
    const contest = editableContest({ formatName: 'final_submission' });
    const calls = mockApi({ ...staffViewer(EDIT), ...contestEditorRoutes(contest) });
    const { wrapper } = await mountAndWaitFor(PATH, 'không hỗ trợ ghost');
    expect(
      wrapper.find('[data-testid="ghost-unsupported"] [data-placement="forbidden"]').exists(),
    ).toBe(true);
    expect(calls.some((call) => call.path.endsWith('/ghosts'))).toBe(false);
  });

  it('shows the two card skeletons while the set loads', async () => {
    mockApi(routes());
    const answer = globalThis.fetch;
    vi.stubGlobal('fetch', (input: string, init?: RequestInit) =>
      String(input).includes('/ghosts') ? new Promise<Response>(() => {}) : answer(input, init),
    );
    const { wrapper } = await mountAndWaitFor(PATH, 'Ghost');
    const skeleton = wrapper.get('[data-testid="query-skeleton"] [data-ghost-part="grid"]');
    expect(
      ['ghost-import', 'ghost-current'].map(
        (region) => skeleton.findAll(`[data-skeleton-region="${region}"]`).length,
      ),
    ).toEqual([1, 1]);
  });

  it('says a body over 1 MiB is too large and keeps the set', async () => {
    mockApi(routes({ [PUT]: fail(413, 'payload_too_large') }));
    const { wrapper } = await mountAndWaitFor(PATH, 'Nhập ghost từ CSV');
    await pickCsv(wrapper);
    await click(wrapper, 'Xem trước');
    expect(wrapper.get('[data-testid="ghost-import"] [role="alert"]').text()).toContain('quá lớn');
    expect(wrapper.get('[data-testid="ghost-current"]').text()).toContain('2 ghost');
  });

  it('lists a row-less issue without a row prefix', async () => {
    const issues = [issue('csv', 'too_many_ghosts', 'x')];
    mockApi(routes({ [PUT]: fail(400, 'ghost_import_invalid', undefined, issues) }));
    const { wrapper } = await mountAndWaitFor(PATH, 'Nhập ghost từ CSV');
    await pickCsv(wrapper);
    await click(wrapper, 'Xem trước');
    const items = wrapper.findAll('[data-testid="ghost-import"] [role="alert"] li');
    expect(items.map((item) => item.text())).toEqual(['Quá nhiều ghost (tối đa 2000).']);
  });

  it('shows the error state, not the cards, when the viewer may not read the set', async () => {
    mockApi(routes({ [LIST]: fail(403, 'forbidden') }));
    const { wrapper } = await mountAndWaitFor(PATH, 'Ghost');
    await flushPromises();
    expect(wrapper.find('[data-testid="ghost-current"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="bit"]').exists()).toBe(true);
  });

  it.each(['vi', 'en'] as const)(
    'compiles every admin.ghosts message in %s (a bare @ is a link)',
    (locale) => {
      const admin: unknown = i18n.global.getLocaleMessage(locale).admin;
      const ghosts: unknown = Reflect.get(Object(admin), 'ghosts');
      const failures: string[] = [];
      const walk = (node: unknown, path: string) => {
        if (typeof node === 'string')
          baseCompile(node, { onError: (error) => failures.push(`${path}: ${error.message}`) });
        else if (node && typeof node === 'object')
          for (const [key, child] of Object.entries(node)) walk(child, `${path}.${key}`);
      };
      walk(ghosts, 'admin.ghosts');
      expect(failures).toEqual([]);
    },
  );
});
