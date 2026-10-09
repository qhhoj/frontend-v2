import { describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import type { ApiCall } from '@/test/mock-api';
import { fail, mockApi, ok } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { staffViewer } from '@/test/admin-routes';
import { LANGUAGES, languageAdmin } from '@/test/admin-fixtures/languages';

const BOTH = ['judge.change_language', 'judge.add_language'];
const routes = (extra = {}, permissions = BOTH) => ({
  ...staffViewer(permissions),
  'GET /admin/languages': ok(LANGUAGES),
  ...extra,
});
type Wrapper = Awaited<ReturnType<typeof mountApp>>['wrapper'];

/** The screens are lazy routes: the form is there once its chunk has loaded. */
async function mountForm(path: string) {
  const mounted = await mountApp(path);
  await vi.waitFor(() =>
    expect(mounted.wrapper.find('[data-testid="language-save-bar"]').exists()).toBe(true),
  );
  return mounted;
}
async function fillIn(wrapper: Wrapper, values: Record<string, string>) {
  for (const [field, value] of Object.entries(values))
    await wrapper.get(`#language-${field}`).setValue(value);
}
async function press(wrapper: Wrapper, label: string) {
  await wrapper
    .findAll('button')
    .find((button) => button.text() === label)!
    .trigger('click');
  await flushPromises();
}
const writes = (calls: ApiCall[]) =>
  calls.filter((call) => call.method !== 'GET' && call.path.startsWith('/admin/languages'));
const KOTLIN = {
  key: 'KOTLIN',
  name: 'Kotlin',
  commonName: 'Kotlin',
  ace: 'kotlin',
  pygments: 'kotlin',
  extension: 'kt',
};

describe('LanguageFormPage, create', () => {
  it('creates a language from the three groups and goes back to the list', async () => {
    const calls = mockApi(
      routes({ 'POST /admin/languages': ok(languageAdmin({ key: 'KOTLIN', name: 'Kotlin' })) }),
    );
    const { wrapper, router } = await mountForm('/admin/languages/new');
    await fillIn(wrapper, {
      ...KOTLIN,
      shortName: 'KT',
      fileSizeLimit: '67108864',
      template: 'fun main() {\n}',
    });
    await wrapper.get('#language-includeInProblem').setValue(true);
    await press(wrapper, 'Tạo ngôn ngữ');
    expect(writes(calls).map((call) => [call.method, call.path, call.body])).toEqual([
      [
        'POST',
        '/admin/languages',
        {
          ...KOTLIN,
          shortName: 'KT',
          fileOnly: false,
          fileSizeLimit: 67108864,
          includeInProblem: true,
          template: 'fun main() {\n}',
          info: '',
          description: '',
        },
      ],
    ]);
    // The list is a lazy route: the redirect lands once its chunk has loaded.
    await vi.waitFor(() => expect(router.currentRoute.value.name).toBe('admin-languages'));
  });

  it('leaves the short name out when it is empty', async () => {
    const calls = mockApi(routes({ 'POST /admin/languages': ok(languageAdmin()) }));
    const { wrapper } = await mountForm('/admin/languages/new');
    await fillIn(wrapper, KOTLIN);
    await press(wrapper, 'Tạo ngôn ngữ');
    expect(Object.keys(writes(calls)[0]!.body as object)).not.toContain('shortName');
  });

  it('shows what is wrong under each box and sends nothing', async () => {
    const calls = mockApi(routes());
    const { wrapper } = await mountForm('/admin/languages/new');
    await fillIn(wrapper, { key: 'a b' });
    await press(wrapper, 'Tạo ngôn ngữ');
    expect(writes(calls)).toEqual([]);
    for (const field of ['key', 'name', 'commonName', 'ace', 'pygments', 'extension'])
      expect(wrapper.get(`#language-${field}`).attributes('aria-invalid'), field).toBe('true');
  });

  it('puts a taken key under the key box and stays on the page', async () => {
    mockApi(
      routes({ 'POST /admin/languages': fail(409, 'conflict', { key: ['This key is taken.'] }) }),
    );
    const { wrapper, router } = await mountForm('/admin/languages/new');
    await fillIn(wrapper, KOTLIN);
    await press(wrapper, 'Tạo ngôn ngữ');
    expect(wrapper.text()).toContain('Mã này đã có ngôn ngữ khác dùng.');
    expect(router.currentRoute.value.name).toBe('admin-languageNew');
  });

  it('keeps a sticky save bar with Huỷ and the primary action', async () => {
    mockApi(routes());
    const { wrapper } = await mountForm('/admin/languages/new');
    const bar = wrapper.get('[data-testid="language-save-bar"]');
    expect(bar.classes()).toContain('sticky');
    expect(bar.text()).toContain('Huỷ');
    expect(bar.text()).toContain('Tạo ngôn ngữ');
  });

  it('counts the characters of the three text areas', async () => {
    mockApi(routes());
    const { wrapper } = await mountForm('/admin/languages/new');
    await fillIn(wrapper, { template: 'fun main() {\n}' });
    expect(wrapper.get('#language-template-count').text()).toMatch(/^14 \/ 65\D?536$/);
  });
});

describe('LanguageFormPage, edit', () => {
  const ruby = () => LANGUAGES.find((language) => language.key === 'RUBY')!;

  it('shows the key sealed and the other fields filled in', async () => {
    mockApi(routes());
    const { wrapper } = await mountForm('/admin/languages/RUBY');
    expect(wrapper.find('#language-key').exists()).toBe(false);
    expect(wrapper.get('[data-testid="language-key-sealed"]').text()).toContain('RUBY');
    expect(wrapper.get('[data-testid="language-key-sealed"]').text()).toContain('Cố định');
    expect((wrapper.get('#language-name').element as HTMLInputElement).value).toBe('Ruby');
  });

  it('sends only the changed field to the language’s id', async () => {
    const calls = mockApi(
      routes({
        [`PATCH /admin/languages/${ruby().id}`]: ok({ ...ruby(), name: 'Ruby 3' }),
      }),
    );
    const { wrapper } = await mountForm('/admin/languages/RUBY');
    await fillIn(wrapper, { name: 'Ruby 3' });
    await press(wrapper, 'Lưu thay đổi');
    expect(writes(calls).map((call) => [call.method, call.path, call.body])).toEqual([
      ['PATCH', `/admin/languages/${ruby().id}`, { name: 'Ruby 3' }],
    ]);
    expect(wrapper.text()).toContain('Đã lưu.');
  });

  it('clears the short name with null', async () => {
    const withShort = languageAdmin({
      id: '0192a000-0000-7000-8000-00000000b199',
      key: 'RS',
      shortName: 'RS',
    });
    const calls = mockApi(
      routes({
        'GET /admin/languages': ok([withShort]),
        [`PATCH /admin/languages/${withShort.id}`]: ok({ ...withShort, shortName: null }),
      }),
    );
    const { wrapper } = await mountForm('/admin/languages/RS');
    await fillIn(wrapper, { shortName: '' });
    await press(wrapper, 'Lưu thay đổi');
    expect(writes(calls)[0]!.body).toEqual({ shortName: null });
  });

  it('sends nothing and disables the button while nothing changed', async () => {
    const calls = mockApi(routes());
    const { wrapper } = await mountForm('/admin/languages/RUBY');
    const save = wrapper.findAll('button').find((button) => button.text() === 'Lưu thay đổi')!;
    expect(save.attributes('aria-disabled')).toBe('true');
    await save.trigger('click');
    expect(writes(calls)).toEqual([]);
  });

  it('says there is no such language for an unknown key, and for a key with # in it opens the right one', async () => {
    mockApi(
      routes({
        'GET /admin/languages': ok([
          ...LANGUAGES,
          languageAdmin({ id: '0192a000-0000-7000-8000-00000000b1c3', key: 'C#', name: 'C Sharp' }),
        ]),
      }),
    );
    const missing = await mountApp('/admin/languages/NOPE');
    await vi.waitFor(() => expect(missing.wrapper.text()).toContain('Không có ngôn ngữ “NOPE”.'));
    const sharp = await mountForm('/admin/languages/C%23');
    expect((sharp.wrapper.get('#language-name').element as HTMLInputElement).value).toBe('C Sharp');
  });
});

describe('language screens, permissions', () => {
  it('opens "new" only for add_language and "edit" only for change_language', async () => {
    mockApi(routes({}, ['judge.change_language']));
    const noAdd = await mountApp('/admin/languages/new');
    await vi.waitFor(() =>
      expect(noAdd.wrapper.find('[data-testid="admin-forbidden"]').exists()).toBe(true),
    );
    mockApi(routes({}, ['judge.add_language']));
    const noChange = await mountApp('/admin/languages/RUBY');
    await vi.waitFor(() =>
      expect(noChange.wrapper.find('[data-testid="admin-forbidden"]').exists()).toBe(true),
    );
  });
});
