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
});

describe('LanguageFormPage, edit', () => {
  const ruby = () => LANGUAGES.find((language) => language.key === 'RUBY')!;

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
