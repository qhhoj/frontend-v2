import { describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { mockApi, ok, page } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { staffViewer } from '@/test/admin-routes';
import { siteData } from '@/test/admin-fixtures/site';

const PERMS = ['judge.change_miscconfig'];
type Mounted = Awaited<ReturnType<typeof mountApp>>['wrapper'];

/** The screen is a lazy route: the table is there once its chunk and the site have loaded. */
const mountConfig = async () => {
  const mounted = await mountApp('/admin/config');
  await vi.waitFor(() => expect(mounted.wrapper.findAll('tbody tr').length).toBeGreaterThan(0));
  return mounted.wrapper;
};
/** The editor is a drawer and the delete confirm a dialog on top of it: both render into `document.body`. */
const buttonNamed = (label: string, root: ParentNode = document.body) =>
  [...root.querySelectorAll<HTMLButtonElement>('button')].find(
    (button) => button.textContent?.trim() === label,
  )!;
const field = (id: string) => document.getElementById(id) as HTMLInputElement;
const typeInto = async (id: string, value: string) => {
  field(id).value = value;
  field(id).dispatchEvent(new Event('input'));
  await flushPromises();
};
/** The topmost dialog: the confirm opened over the editor drawer. */
const topDialog = () => [...document.querySelectorAll<HTMLElement>('[role="dialog"]')].at(-1)!;
const openEditor = async (wrapper: Mounted, key: string) => {
  await rowWith(wrapper, key).get('button').trigger('click');
  await vi.waitFor(() => expect(field('config-value')).not.toBeNull());
};
const rowWith = (wrapper: Mounted, key: string) =>
  wrapper.findAll('tbody tr').find((row) => row.text().includes(key))!;

describe('MiscConfigPage', () => {
  it('lists keys with their kind and length and edits one with a sandboxed preview', async () => {
    const calls = mockApi({
      ...staffViewer(PERMS),
      'GET /site': ok(siteData()),
      'PUT /admin/site/config/announcement': ok({ key: 'announcement', value: '<p>Mới</p>' }),
      'GET /admin/site/config/announcement/revisions': page([]),
    });
    const wrapper = await mountConfig();
    expect(rowWith(wrapper, 'announcement').text()).toContain('HTML');
    await openEditor(wrapper, 'announcement');
    expect(document.querySelector('iframe')!.getAttribute('sandbox')).toBe('');
    await typeInto('config-value', '<p>Mới</p>');
    buttonNamed('Lưu').click();
    await flushPromises();
    expect(calls.find((call) => call.method === 'PUT')?.body).toEqual({ value: '<p>Mới</p>' });
    expect(calls.filter((call) => call.path === '/site')).toHaveLength(1);
    expect(wrapper.text()).toContain('<p>Mới</p>');
  });

  it('adds a key and deletes one after confirming', async () => {
    const calls = mockApi({
      ...staffViewer(PERMS),
      'GET /site': ok(siteData()),
      'PUT /admin/site/config/new_key': ok({ key: 'new_key', value: 'x' }),
      'DELETE /admin/site/config/contact_email': { status: 204 },
      'GET /admin/site/config/contact_email/revisions': page([]),
      'GET /admin/site/config/new_key/revisions': page([]),
    });
    const wrapper = await mountConfig();
    buttonNamed('Thêm khoá').click();
    await vi.waitFor(() => expect(field('config-key')).not.toBeNull());
    await typeInto('config-key', 'new_key');
    await typeInto('config-value', 'x');
    buttonNamed('Lưu').click();
    await flushPromises();
    expect(wrapper.findAll('tbody tr').some((row) => row.text().includes('new_key'))).toBe(true);
    await openEditor(wrapper, 'contact_email');
    buttonNamed('Xoá khoá').click();
    await flushPromises();
    expect(calls.some((call) => call.method === 'DELETE')).toBe(false);
    await vi.waitFor(() => expect(topDialog().textContent).toContain('Mọi trang ngừng dùng'));
    buttonNamed('Xoá khoá', topDialog()).click();
    await flushPromises();
    expect(calls.some((call) => call.method === 'DELETE')).toBe(true);
    expect(wrapper.findAll('tbody tr').some((row) => row.text().includes('contact_email'))).toBe(
      false,
    );
    expect(wrapper.get('[role="status"]').text()).toContain('contact_email');
    await vi.waitFor(() => expect(document.activeElement).toBe(buttonNamed('Thêm khoá')));
  });
});
