import { flushPromises } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { cannedReply } from '@/test/community-fixtures';
import { confirmDialog, openDialog, staffViewer } from '@/test/admin-routes';
import { fail, invalid, issue, mockApi, noContent, ok, page, sequence } from '@/test/mock-api';
import type { MockHandler } from '@/test/mock-api';
import { mountApp } from '@/test/mount';

const PATH = '/admin/tickets/canned';
const FIRST = cannedReply();
const SECOND = cannedReply({
  id: 'r-2',
  title: 'Đã sửa test',
  body: 'Đã sửa bài {bài}.',
  order: 1,
});
type Mounted = Awaited<ReturnType<typeof mountApp>>['wrapper'];

async function mountScreen(
  routes: Record<string, MockHandler>,
  permissions = ['judge.change_ticket'],
) {
  const calls = mockApi({ ...staffViewer(permissions), ...routes });
  const { wrapper } = await mountApp(PATH);
  await vi.waitFor(() =>
    expect(wrapper.find('[data-testid="canned-replies"]').exists()).toBe(true),
  );
  await flushPromises();
  return { wrapper, calls };
}
const buttonNamed = (wrapper: Mounted, label: string) =>
  wrapper.findAll('button').find((button) => button.text() === label)!;
const setField = async (id: string, value: string) => {
  const field = openDialog().querySelector<HTMLInputElement | HTMLTextAreaElement>(`#${id}`)!;
  field.value = value;
  field.dispatchEvent(new Event('input'));
  await flushPromises();
};

describe('canned replies screen', () => {
  it('adds a reply, sends it once on a double confirm and refreshes the list', async () => {
    let created = false;
    const { wrapper, calls } = await mountScreen({
      'GET /ticket-canned-replies': () =>
        page(created ? [FIRST, SECOND] : [FIRST], { pageSize: 100 }),
      'POST /ticket-canned-replies': () => {
        created = true;
        return ok(SECOND);
      },
    });
    await buttonNamed(wrapper, 'Thêm mẫu').trigger('click');
    await flushPromises();
    await setField('canned-title', 'Đã sửa test');
    await setField('canned-body', 'Đã sửa bài {bài}.');
    const save = [...openDialog().querySelectorAll<HTMLButtonElement>('button[type="submit"]')][0]!;
    save.click();
    save.click();
    await flushPromises();
    expect(calls.filter((call) => call.method === 'POST')).toHaveLength(1);
    expect(calls.find((call) => call.method === 'POST')!.body).toEqual({
      title: 'Đã sửa test',
      body: 'Đã sửa bài {bài}.',
    });
    expect(wrapper.findAll('tbody tr')).toHaveLength(2);
    expect(wrapper.text()).toContain('Đã lưu mẫu “Đã sửa test”.');
  });

  it('keeps the dialog open with field texts when the input is refused here or by the server', async () => {
    const { wrapper, calls } = await mountScreen({
      'GET /ticket-canned-replies': page([FIRST], { pageSize: 100 }),
      'POST /ticket-canned-replies': invalid(issue('title', 'too_long', 'title is too long')),
    });
    await buttonNamed(wrapper, 'Thêm mẫu').trigger('click');
    await flushPromises();
    await confirmDialog('Lưu mẫu');
    expect(openDialog().textContent).toContain('Nhập tiêu đề.');
    expect(calls.some((call) => call.method === 'POST')).toBe(false);
    await setField('canned-title', 'T');
    await setField('canned-body', 'B');
    await confirmDialog('Lưu mẫu');
    expect(openDialog().querySelector('#canned-title')!.getAttribute('aria-invalid')).toBe('true');
  });

  it('deletes after confirming, and reloads the list when the reply was already gone', async () => {
    const { wrapper, calls } = await mountScreen({
      'GET /ticket-canned-replies': sequence(
        page([FIRST, SECOND], { pageSize: 100 }),
        page([SECOND], { pageSize: 100 }),
      ),
      [`DELETE /ticket-canned-replies/${FIRST.id}`]: fail(404, 'not_found'),
      [`DELETE /ticket-canned-replies/${SECOND.id}`]: noContent(),
    });
    await wrapper.get(`[aria-label="Xóa mẫu ${FIRST.title}"]`).trigger('click');
    await flushPromises();
    await confirmDialog('Xóa mẫu');
    expect(wrapper.text()).toContain('Mẫu này đã bị xóa ở nơi khác.');
    expect(wrapper.findAll('tbody tr')).toHaveLength(1);
    expect(calls.filter((call) => call.path === '/ticket-canned-replies')).toHaveLength(2);
  });

  it('refuses a staff member without judge.change_ticket', async () => {
    mockApi({ ...staffViewer(['judge.add_problem']) });
    const { wrapper } = await mountApp(PATH);
    await vi.waitFor(() => expect(wrapper.text()).toContain('Bạn chưa có quyền mở mục này'));
  });
});
