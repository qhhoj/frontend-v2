import { describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { fail, invalid, issue, mockApi, ok } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { confirmDialog, staffViewer } from '@/test/admin-routes';
import { navItem, siteData } from '@/test/admin-fixtures/site';

const PERMS = ['judge.change_navigationbar'];
type Mounted = Awaited<ReturnType<typeof mountApp>>['wrapper'];

/** The screen is a lazy route: the tree is there once its chunk and the site have loaded. */
const mountNav = async () => {
  const mounted = await mountApp('/admin/nav');
  await vi.waitFor(() => expect(mounted.wrapper.findAll('tbody tr').length).toBeGreaterThan(0));
  return mounted.wrapper;
};
const rowWith = (wrapper: Mounted, text: string) =>
  wrapper.findAll('tbody tr').find((row) => row.text().includes(text))!;
const buttonIn = (row: ReturnType<Mounted['findAll']>[number], label: string) =>
  row.findAll('button').find((button) => button.text() === label)!;
const editRow = async (wrapper: Mounted, key: string) => {
  await buttonIn(rowWith(wrapper, key), 'Sửa').trigger('click');
  await flushPromises();
};
const dialog = () => document.body.querySelector('[role="dialog"]')!;
const setField = async (selector: string, value: string) => {
  const field = dialog().querySelector(selector) as HTMLInputElement | HTMLSelectElement;
  field.value = value;
  field.dispatchEvent(new Event(field.tagName === 'SELECT' ? 'change' : 'input'));
  await flushPromises();
};

describe('NavBarPage', () => {
  it('flags a stored regex that does not compile on its row', async () => {
    mockApi({ ...staffViewer(PERMS), 'GET /site': ok(siteData()) });
    const wrapper = await mountNav();
    const row = rowWith(wrapper, 'b-old');
    const [firstCell, ...otherCells] = row.findAll('td');
    expect(firstCell!.text()).toContain('Regex lỗi');
    expect(firstCell!.classes()).not.toContain('hidden');
    expect(otherCells.some((cell) => cell.text().includes('Regex lỗi'))).toBe(false);
    expect(row.text()).toContain('Ẩn');
  });

  it('keeps a bad regex from being sent and puts a backend cycle refusal under the parent', async () => {
    const calls = mockApi({
      ...staffViewer(PERMS),
      'GET /site': ok(siteData()),
      'PATCH /admin/site/navigation/nav-blog': invalid(
        issue('parentId', 'parent_cycle', 'An entry cannot sit under itself or its descendants.'),
      ),
    });
    const wrapper = await mountNav();
    await editRow(wrapper, 'blog');
    await setField('#nav-regex', '(');
    await confirmDialog('Lưu');
    expect(calls.some((call) => call.method === 'PATCH')).toBe(false);
    expect(dialog().querySelector('#nav-regex')?.getAttribute('aria-invalid')).toBe('true');
    await setField('#nav-regex', '^/blog');
    await setField('#nav-parent', 'nav-home');
    await confirmDialog('Lưu');
    expect(dialog().textContent).toContain(
      'Một mục không thể nằm dưới chính nó hoặc mục con của nó.',
    );
  });

  it('moves an item to the top level by sending parentId null', async () => {
    const calls = mockApi({
      ...staffViewer(PERMS),
      'GET /site': ok(siteData()),
      'PATCH /admin/site/navigation/nav-b-org': ok(
        navItem({ id: 'nav-b-org', key: 'b-org', parentId: null }),
      ),
    });
    const wrapper = await mountNav();
    await editRow(wrapper, 'b-org');
    await setField('#nav-parent', '');
    await confirmDialog('Lưu');
    expect(calls.find((call) => call.method === 'PATCH')?.body).toEqual({ parentId: null });
  });

  it('puts a duplicate key from the backend’s 409 under the key box and keeps the dialog open', async () => {
    mockApi({
      ...staffViewer(PERMS),
      'GET /site': ok(siteData()),
      'POST /admin/site/navigation': fail(409, 'conflict', { key: ['This key is taken.'] }),
    });
    const wrapper = await mountNav();
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Thêm mục')!
      .trigger('click');
    await flushPromises();
    await setField('#nav-key', 'home');
    await setField('#nav-label', 'Trang chủ 2');
    await setField('#nav-path', '/home2');
    await confirmDialog('Lưu');
    expect(dialog().querySelector('#nav-key')?.getAttribute('aria-invalid')).toBe('true');
    expect(dialog().textContent).toContain('Khoá đã có.');
  });

  it('says a deleted item is gone and moves focus to the add button', async () => {
    mockApi({
      ...staffViewer(PERMS),
      'GET /site': ok(siteData()),
      'DELETE /admin/site/navigation/nav-blog': { status: 204 },
    });
    const wrapper = await mountNav();
    await buttonIn(rowWith(wrapper, 'blog'), 'Xoá').trigger('click');
    await flushPromises();
    await confirmDialog('Xoá');
    await vi.waitFor(() => expect(document.activeElement?.textContent?.trim()).toBe('Thêm mục'));
  });

  it('explains why an item with children cannot be deleted', async () => {
    mockApi({
      ...staffViewer(PERMS),
      'GET /site': ok(siteData()),
      'DELETE /admin/site/navigation/nav-blog': fail(409, 'conflict'),
    });
    const wrapper = await mountNav();
    await buttonIn(rowWith(wrapper, 'blog'), 'Xoá').trigger('click');
    await flushPromises();
    await confirmDialog('Xoá');
    expect(wrapper.text()).toContain('Mục có con không xoá được; xoá các mục con trước.');
  });
});
