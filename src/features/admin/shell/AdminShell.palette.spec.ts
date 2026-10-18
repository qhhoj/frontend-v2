import { describe, expect, it, vi } from 'vitest';
import { mockApi, ok, page } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { problemItem, problemMeta } from '@/test/fixtures';
import { staffViewer } from '@/test/admin-routes';

const STATS = {
  judgedToday: 0,
  acceptedToday: 0,
  verdictsToday: [],
  queueLength: 3,
  judgesOnline: 1,
  judgesTotal: 2,
};
const PROBLEMS = page([problemItem({ code: 'aplusb', name: 'A cộng B' })]);

async function openPalette(path: string) {
  const { wrapper, router } = await mountApp(path);
  await vi.waitFor(() => expect(wrapper.find('[data-testid="admin-topbar"]').exists()).toBe(true));
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, cancelable: true }));
  const box = await vi.waitFor(() => {
    const found = document.body.querySelector<HTMLInputElement>('[role="combobox"]');
    if (!found) throw new Error('palette not open yet');
    return found;
  });
  return { wrapper, router, box };
}
const type = (box: HTMLInputElement, text: string) => {
  box.value = text;
  box.dispatchEvent(new Event('input'));
};
const press = (box: HTMLInputElement, key: string) =>
  box.dispatchEvent(new KeyboardEvent('keydown', { key, cancelable: true }));
const optionTexts = () =>
  Array.from(document.body.querySelectorAll('[role="option"]'), (node) => node.textContent);

/** jsdom has no layout: the palette scrolls the active option into view. */
Element.prototype.scrollIntoView = vi.fn();

describe('admin search palette', () => {
  it('asks only the indexes whose screens the viewer may open, and opens a hit', async () => {
    const calls = mockApi({
      ...staffViewer(['judge.edit_own_problem']),
      'GET /problems': PROBLEMS,
      // The editor the hit opens: what it shows does not matter here.
      'GET /problems/aplusb': { status: 404, body: { error: { code: 'not_found', message: '' } } },
      'GET /problems/meta': ok(problemMeta()),
    });
    const { router, box } = await openPalette('/admin');
    type(box, 'ap');
    await vi.waitFor(() => expect(optionTexts().join()).toContain('A cộng B'));
    // The dashboard's setter tiles count problems too: one-row pages of public or private problems, never a search.
    const isSetterCount = (call: (typeof calls)[number]) =>
      call.path === '/problems' &&
      call.query.get('pageSize') === '1' &&
      ['public', 'private'].includes(call.query.get('visibility') ?? '') &&
      !call.query.has('q');
    const searched = calls.filter(
      (call) => !['/auth/me', '/profile'].includes(call.path) && !isSetterCount(call),
    );
    expect(searched.map((call) => call.path)).toEqual(['/problems']);
    expect(searched[0]!.query.get('visibility')).toBe('all');
    expect(searched[0]!.query.get('q')).toBe('ap');
    press(box, 'ArrowDown');
    press(box, 'Enter');
    await vi.waitFor(() =>
      expect(router.currentRoute.value.fullPath).toBe('/admin/problems/aplusb/general'),
    );
  });

  it('matches screens at once and does not look records up for one character', async () => {
    const calls = mockApi({
      ...staffViewer(['judge.change_judge', 'judge.ban_user']),
      'GET /submissions/stats': ok(STATS),
    });
    const { box } = await openPalette('/admin');
    type(box, 'm');
    await vi.waitFor(() => expect(optionTexts()).toContain('Máy chấm/admin/judges'));
    await new Promise((resolve) => setTimeout(resolve, 400));
    expect(calls.map((call) => call.path)).not.toContain('/admin/users');
    expect(document.body.querySelector('[role="dialog"] [role="status"]')?.textContent).toContain(
      'ít nhất 2',
    );
  });
});
