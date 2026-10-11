import { describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { mockApi, ok } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { confirmDialog, staffViewer } from '@/test/admin-routes';
import { siteData } from '@/test/admin-fixtures/site';

const PERMS = ['judge.change_miscconfig'];
type Mounted = Awaited<ReturnType<typeof mountApp>>['wrapper'];

/** The screen is a lazy route: the table is there once its chunk and the site have loaded. */
const mountConfig = async () => {
  const mounted = await mountApp('/admin/config');
  await vi.waitFor(() => expect(mounted.wrapper.findAll('tbody tr').length).toBeGreaterThan(0));
  return mounted.wrapper;
};
const buttonNamed = (wrapper: Mounted, label: string) =>
  wrapper.findAll('button').find((button) => button.text() === label)!;
const rowWith = (wrapper: Mounted, key: string) =>
  wrapper.findAll('tbody tr').find((row) => row.text().includes(key))!;

describe('MiscConfigPage', () => {
  it('lists keys with their kind and length and edits one with a sandboxed preview', async () => {
    const calls = mockApi({
      ...staffViewer(PERMS),
      'GET /site': ok(siteData()),
      'PUT /admin/site/config/announcement': ok({ key: 'announcement', value: '<p>Mới</p>' }),
    });
    const wrapper = await mountConfig();
    expect(rowWith(wrapper, 'announcement').text()).toContain('HTML');
    await rowWith(wrapper, 'announcement').get('button').trigger('click');
    const frame = wrapper.get('iframe');
    expect(frame.attributes('sandbox')).toBe('');
    await wrapper.get('#config-value').setValue('<p>Mới</p>');
    await buttonNamed(wrapper, 'Lưu').trigger('click');
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
    });
    const wrapper = await mountConfig();
    await buttonNamed(wrapper, 'Thêm khoá').trigger('click');
    await wrapper.get('#config-key').setValue('new_key');
    await wrapper.get('#config-value').setValue('x');
    await buttonNamed(wrapper, 'Lưu').trigger('click');
    await flushPromises();
    expect(wrapper.text()).toContain('new_key');
    await rowWith(wrapper, 'contact_email').get('button').trigger('click');
    await buttonNamed(wrapper, 'Xoá khoá').trigger('click');
    await flushPromises();
    expect(calls.some((call) => call.method === 'DELETE')).toBe(false);
    await confirmDialog('Xoá khoá');
    expect(calls.some((call) => call.method === 'DELETE')).toBe(true);
    expect(wrapper.findAll('tbody tr').some((row) => row.text().includes('contact_email'))).toBe(
      false,
    );
    expect(wrapper.get('[role="status"]').text()).toContain('contact_email');
    await vi.waitFor(() =>
      expect(document.activeElement).toBe(buttonNamed(wrapper, 'Thêm khoá').element),
    );
  });
});
