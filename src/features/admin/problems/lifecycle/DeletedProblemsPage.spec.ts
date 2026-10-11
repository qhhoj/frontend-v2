import { describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { fail, mockApi, noContent, ok, page, sequence } from '@/test/mock-api';
import { problemEditingMeta } from '@/test/admin-fixtures/problems';
import type { ApiCall } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { confirmDialog, openDialog, staffViewer } from '@/test/admin-routes';
import { deletedProblem } from '@/test/f4-fixtures';

const DELETE = ['judge.delete_problem'];
type Wrapper = Awaited<ReturnType<typeof mountApp>>['wrapper'];

const mountDeleted = async () => {
  const mounted = await mountApp('/admin/problems/deleted');
  await vi.waitFor(
    () => {
      const section = mounted.wrapper.find('[data-testid="deleted-problems"]');
      if (!section.exists() || section.find('[data-testid="query-skeleton"]').exists())
        throw new Error('not yet');
    },
    { timeout: 5000 },
  );
  await flushPromises();
  return mounted;
};
const buttonNamed = (wrapper: Wrapper, name: string) =>
  wrapper.findAll('button').find((button) => button.attributes('aria-label') === name);
const listCalls = (calls: ApiCall[]) => calls.filter((call) => call.path === '/problems/deleted');
const dialogConfirm = (label: string) =>
  [...openDialog().querySelectorAll<HTMLButtonElement>('button[type="submit"]')].find(
    (button) => button.textContent?.trim() === label,
  )!;
async function typeInDialog(text: string) {
  const input = openDialog().querySelector('input')!;
  input.value = text;
  input.dispatchEvent(new Event('input'));
  await flushPromises();
}

describe('DeletedProblemsPage', () => {
  it('lists days left; a purged row offers nothing and only a superuser may purge', async () => {
    mockApi({
      ...staffViewer(DELETE),
      'GET /problems/deleted': page([
        deletedProblem(),
        deletedProblem({ code: 'hethan', name: 'Hết hạn', daysLeft: 0 }),
        deletedProblem({ code: 'cu', name: 'Cũ', daysLeft: 0, isPurged: true }),
      ]),
    });
    const { wrapper } = await mountDeleted();
    const text = wrapper.text();
    expect(text).toContain('Còn 26 ngày');
    expect(text).toContain('Đến hạn xóa hẳn');
    expect(text).toContain('Đã xóa hẳn');
    expect(buttonNamed(wrapper, 'Khôi phục cuvui')).toBeDefined();
    expect(buttonNamed(wrapper, 'Khôi phục cu')).toBeUndefined();
    expect(buttonNamed(wrapper, 'Xóa hẳn cuvui ngay')).toBeUndefined();
  });

  it('restores once on a double click, says so and refetches the list', async () => {
    const calls = mockApi({
      ...staffViewer(DELETE),
      'GET /problems/deleted': sequence(page([deletedProblem()]), page([])),
      'POST /problems/cuvui/restore': noContent(),
    });
    const { wrapper } = await mountDeleted();
    const restore = buttonNamed(wrapper, 'Khôi phục cuvui')!;
    void restore.trigger('click');
    void restore.trigger('click');
    await flushPromises();
    expect(calls.filter((call) => call.method === 'POST')).toHaveLength(1);
    expect(wrapper.get('[role="status"]').text()).toContain('Đã khôi phục cuvui');
    expect(listCalls(calls)).toHaveLength(2);
  });

  it('shows a 409 purged from a stale row and refetches the list', async () => {
    const calls = mockApi({
      ...staffViewer(DELETE),
      'GET /problems/deleted': page([deletedProblem()]),
      'POST /problems/cuvui/restore': fail(409, 'purged'),
    });
    const { wrapper } = await mountDeleted();
    await buttonNamed(wrapper, 'Khôi phục cuvui')!.trigger('click');
    await flushPromises();
    expect(wrapper.get('[role="alert"]').text()).toContain('Bài đã bị xóa hẳn.');
    expect(listCalls(calls)).toHaveLength(2);
  });

  it('purges now only after the exact code is typed, then reports it as queued', async () => {
    const calls = mockApi({
      ...staffViewer(DELETE, { isSuperuser: true }),
      'GET /problems/deleted': page([deletedProblem()]),
      'POST /problems/cuvui/purge-now': { status: 202, body: { data: { queued: true } } },
    });
    const { wrapper } = await mountDeleted();
    await buttonNamed(wrapper, 'Xóa hẳn cuvui ngay')!.trigger('click');
    await flushPromises();
    expect(dialogConfirm('Xóa hẳn').getAttribute('aria-disabled')).toBe('true');
    await typeInDialog('CUVUI');
    expect(dialogConfirm('Xóa hẳn').getAttribute('aria-disabled')).toBe('true');
    await typeInDialog('cuvui');
    expect(dialogConfirm('Xóa hẳn').hasAttribute('aria-disabled')).toBe(false);
    await confirmDialog('Xóa hẳn');
    expect(calls.find((call) => call.method === 'POST')!.body).toEqual({ confirmCode: 'cuvui' });
    expect(wrapper.get('[role="status"]').text()).toContain('Đã xếp lịch xóa hẳn cuvui');
  });

  it('reloads the list when a purge hits a stale row, and keeps the refusal in the dialog', async () => {
    const calls = mockApi({
      ...staffViewer(DELETE, { isSuperuser: true }),
      'GET /problems/deleted': page([deletedProblem()]),
      'POST /problems/cuvui/purge-now': fail(409, 'purged'),
    });
    const { wrapper } = await mountDeleted();
    await buttonNamed(wrapper, 'Xóa hẳn cuvui ngay')!.trigger('click');
    await typeInDialog('cuvui');
    await confirmDialog('Xóa hẳn');
    expect(openDialog().textContent).toContain('Bài đã bị xóa hẳn.');
    expect(listCalls(calls)).toHaveLength(2);
  });

  it('shows the list tabs on the problems index only to delete_problem holders', async () => {
    const hasDeletedTab = async (permissions: string[]) => {
      mockApi({
        ...staffViewer(permissions),
        'GET /problems': page([]),
        'GET /problems/meta': ok(problemEditingMeta()),
      });
      const { wrapper } = await mountApp('/admin/problems');
      await vi.waitFor(() => expect(wrapper.find('input[type="search"]').exists()).toBe(true));
      const found = wrapper.findAll('a').some((link) => link.text() === 'Đã xóa');
      wrapper.unmount();
      return found;
    };
    expect(await hasDeletedTab(['judge.edit_own_problem', ...DELETE])).toBe(true);
    expect(await hasDeletedTab(['judge.edit_own_problem'])).toBe(false);
  });
});
