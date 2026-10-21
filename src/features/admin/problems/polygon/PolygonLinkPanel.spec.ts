import { describe, expect, it, vi } from 'vitest';
import { mockApi, ok, page } from '@/test/mock-api';
import type { MockHandler } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { staffViewer } from '@/test/admin-routes';
import { problemEditorRoutes } from '@/test/admin-fixtures/problems';
import { importJob, polygonLinkState } from '@/test/admin-fixtures/polygon';

const mountPanel = async (permissions: string[], routes: Record<string, MockHandler> = {}) => {
  mockApi({
    ...staffViewer(['judge.edit_own_problem', ...permissions]),
    ...problemEditorRoutes(),
    'GET /problems/hcmus41c/polygon': ok(polygonLinkState({ autoSync: true })),
    'GET /problems/hcmus41c/polygon/syncs': page([]),
    ...routes,
  });
  const { wrapper } = await mountApp('/admin/problems/hcmus41c/data?view=advanced');
  await vi.waitFor(
    () => expect(wrapper.find('[data-testid="polygon-link-panel"]').exists()).toBe(true),
    { timeout: 5000 },
  );
  return wrapper.get('[data-testid="polygon-link-panel"]');
};
const buttonsOf = (panel: Awaited<ReturnType<typeof mountPanel>>) =>
  panel.findAll('button').map((button) => button.text());

describe('PolygonLinkPanel', () => {
  vi.setConfig({ testTimeout: 20_000 });

  it('shows the link to an editor without the sync permission, with no sync, auto-sync or unlink control', async () => {
    const panel = await mountPanel([]);
    expect(panel.text()).toContain('dem-cap-chia-het');
    expect(panel.get('[data-testid="polygon-link-read-only"]').text()).toContain(
      'Cần quyền “Đồng bộ bài từ Polygon”',
    );
    expect(panel.get('[data-testid="polygon-link-auto-sync"]').text()).toBe('bật');
    expect(buttonsOf(panel).some((label) => label.startsWith('Đồng bộ ngay'))).toBe(false);
    expect(buttonsOf(panel)).toEqual([expect.stringContaining('Lịch sử đồng bộ')]);
  });

  it('gives a sync permission holder the sync, auto-sync and unlink controls', async () => {
    const panel = await mountPanel(['judge.sync_polygon_problem']);
    expect(panel.find('[data-testid="polygon-link-read-only"]').exists()).toBe(false);
    expect(buttonsOf(panel).some((label) => label.startsWith('Đồng bộ ngay'))).toBe(true);
    expect(buttonsOf(panel)).toContain('Hủy liên kết');
  });

  it('shows a refused save of the options next to the statements it names, when none were saved', async () => {
    const panel = await mountPanel(['judge.sync_polygon_problem'], {
      'PATCH /problems/hcmus41c/polygon': {
        status: 400,
        body: {
          error: {
            code: 'statement_language_required',
            message: 'invalid main statement language (none)',
            params: { languages: ['vietnamese', 'english'] },
          },
        },
      },
    });
    await panel.get('[aria-label="Sửa tùy chọn khi đồng bộ"]').trigger('click');
    const drawer = () => document.body.querySelector<HTMLElement>('[role="dialog"]');
    await vi.waitFor(() => expect(drawer()?.textContent).toContain('Lưu tùy chọn'));
    const save = [...drawer()!.querySelectorAll('button')].find(
      (button) => button.textContent?.trim() === 'Lưu tùy chọn',
    );
    save!.click();
    await vi.waitFor(() =>
      expect(drawer()?.textContent).toContain('Chọn đề chính trong số: vietnamese, english.'),
    );
    expect(drawer()!.querySelector('[data-testid="polygon-languages"]')).not.toBeNull();
  });
  it('draws a select for a statement new on Polygon that a refused save names, and the next save passes', async () => {
    const base = polygonLinkState().link.options;
    const options = {
      ...base,
      mainStatementLanguage: 'vietnamese',
      statementLanguages: ['english=en'],
    };
    const link = polygonLinkState({ options }).link;
    const bodies: unknown[] = [];
    const unmapped = {
      code: 'statement_language_unmapped',
      message: 'statement russian has no site language',
      params: { language: 'russian' },
    };
    const panel = await mountPanel(['judge.sync_polygon_problem'], {
      'GET /problems/hcmus41c/polygon': ok(polygonLinkState({ options })),
      'PATCH /problems/hcmus41c/polygon': ({ body }) => {
        bodies.push(body);
        if (bodies.length === 1) return { status: 400, body: { error: unmapped } };
        return ok({ ...link, options: { ...options, ...(body as object) } });
      },
    });
    await panel.get('[aria-label="Sửa tùy chọn khi đồng bộ"]').trigger('click');
    const drawer = () => document.body.querySelector<HTMLElement>('[role="dialog"]');
    const saveButton = () =>
      [...drawer()!.querySelectorAll('button')].find(
        (button) => button.textContent?.trim() === 'Lưu tùy chọn',
      )!;
    await vi.waitFor(() => expect(drawer()?.textContent).toContain('Lưu tùy chọn'));
    saveButton().click();

    const russianSelect = () => {
      const label = [...drawer()!.querySelectorAll('label')].find(
        (element) => element.textContent?.trim() === 'russian',
      );
      return label ? drawer()!.querySelector<HTMLSelectElement>(`[id="${label.htmlFor}"]`) : null;
    };
    await vi.waitFor(() => expect(russianSelect()?.value).toBe('skip'));
    const errorId = russianSelect()!.getAttribute('aria-describedby') ?? '';
    expect(document.getElementById(errorId)?.textContent).toContain(
      'Chọn ngôn ngữ trên QHHOJ hoặc Bỏ qua cho đề russian.',
    );

    saveButton().click();
    await vi.waitFor(() => expect(bodies).toHaveLength(2));
    expect(bodies[1]).toMatchObject({
      mainStatementLanguage: 'vietnamese',
      statementLanguages: ['english=en', 'russian=skip'],
    });
    await vi.waitFor(() =>
      expect(panel.get('[data-testid="polygon-link-options"]').text()).toContain('russian: bỏ qua'),
    );
  });
  it('follows a sync again when the server answers the job id it already followed', async () => {
    const syncs: unknown[] = [];
    const panel = await mountPanel(['judge.sync_polygon_problem'], {
      'POST /problems/hcmus41c/polygon/sync': () => {
        syncs.push(null);
        return { status: 202, body: { data: { jobId: 'job-sync' } } };
      },
      // Unknown to the queue the first time (polling stops), queued once synced again.
      'GET /problems/imports/job-sync': () =>
        syncs.length < 2
          ? { status: 404, body: { error: { code: 'not_found', message: 'not_found' } } }
          : ok(importJob({ id: 'job-sync', code: 'hcmus41c', purpose: 'sync', queuePosition: 1 })),
    });
    const syncNow = async () => {
      await vi.waitFor(() => expect(document.body.querySelector('[role="dialog"]')).toBeNull());
      const button = panel.findAll('button').find((one) => one.text().startsWith('Đồng bộ ngay'));
      await button!.trigger('click');
      const confirm = await vi.waitFor(() => {
        const found = [...document.body.querySelectorAll('[role="dialog"] button')].find(
          (one) => one.textContent?.trim() === 'Đồng bộ và ghi đè',
        );
        expect(found).toBeDefined();
        return found as HTMLButtonElement;
      });
      confirm.click();
    };
    await syncNow();
    await vi.waitFor(() => expect(syncs).toHaveLength(1));
    await vi.waitFor(() =>
      expect(panel.findAll('button').some((one) => one.text().startsWith('Đồng bộ ngay'))).toBe(
        true,
      ),
    );
    await syncNow();
    await vi.waitFor(() => expect(syncs).toHaveLength(2));
    await vi.waitFor(() =>
      expect(panel.get('[data-banner]').attributes('data-banner')).toBe('running'),
    );
    expect(panel.get('[data-banner]').text()).toContain('Thứ 1 trong hàng đợi');
  });
  it('keeps the settings edited on QHHOJ unless the dialog is ticked, then says what the sync kept', async () => {
    const bodies: unknown[] = [];
    const panel = await mountPanel(['judge.sync_polygon_problem'], {
      'POST /problems/hcmus41c/polygon/sync': ({ body }) => {
        bodies.push(body);
        return { status: 202, body: { data: { jobId: 'job-sync' } } };
      },
      'GET /problems/imports/job-sync': ok(
        importJob({
          id: 'job-sync',
          code: 'hcmus41c',
          purpose: 'sync',
          state: 'completed',
          result: {
            problemId: 'p-1',
            code: 'hcmus41c',
            summary: null,
            attention: null,
            localEdits: { kept: ['timeLimit', 'checker'], updated: ['memoryLimit'] },
          },
        }),
      ),
    });
    const openDialog = async () => {
      await vi.waitFor(() => expect(document.body.querySelector('[role="dialog"]')).toBeNull());
      const button = panel.findAll('button').find((one) => one.text().startsWith('Đồng bộ ngay'));
      await button!.trigger('click');
      return vi.waitFor(() => {
        const box = document.body.querySelector<HTMLInputElement>(
          '[role="dialog"] input[type="checkbox"]',
        );
        expect(box).not.toBeNull();
        return box!;
      });
    };
    const confirm = () =>
      [...document.body.querySelectorAll<HTMLButtonElement>('[role="dialog"] button')]
        .find((one) => one.textContent?.trim() === 'Đồng bộ và ghi đè')!
        .click();

    const box = await openDialog();
    expect(box.checked).toBe(false);
    expect(document.body.querySelector('[role="dialog"]')!.textContent).toContain(
      'Ghi đè cả thiết lập đã sửa trên QHHOJ',
    );
    confirm();
    await vi.waitFor(() => expect(bodies).toHaveLength(1));
    expect(bodies[0]).toBeUndefined();
    await vi.waitFor(() =>
      expect(panel.get('[data-local-edits="kept"]').text()).toBe('giới hạn thời gian, checker'),
    );
    expect(panel.get('[data-local-edits="updated"]').text()).toBe('giới hạn bộ nhớ');

    const ticked = await openDialog();
    expect(ticked.checked).toBe(false);
    ticked.click();
    confirm();
    await vi.waitFor(() => expect(bodies).toHaveLength(2));
    expect(bodies[1]).toEqual({ overwriteLocalEdits: true });
  });
});
