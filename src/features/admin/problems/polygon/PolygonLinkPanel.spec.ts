import { describe, expect, it, vi } from 'vitest';
import { mockApi, ok, page } from '@/test/mock-api';
import type { MockHandler } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { staffViewer } from '@/test/admin-routes';
import { problemEditorRoutes } from '@/test/admin-fixtures/problems';
import { polygonLinkState } from '@/test/admin-fixtures/polygon';

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
});
