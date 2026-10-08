import { flushPromises } from '@vue/test-utils';
import type { VueWrapper } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { settingsRoutes } from '@/test/account-routes';
import { CPP17_ID, PY3_ID, profile } from '@/test/fixtures';
import { invalid, issue, mockApi, ok } from '@/test/mock-api';
import type { ApiCall, MockHandler } from '@/test/mock-api';
import { mountApp } from '@/test/mount';

const patches = (calls: ApiCall[]) =>
  calls.filter((call) => call.method === 'PATCH').map((call) => call.body);
const select = (wrapper: VueWrapper, name: string) =>
  wrapper.get<HTMLSelectElement>(`select[name="${name}"]`);
const optionTexts = (wrapper: VueWrapper, name: string) =>
  select(wrapper, name)
    .findAll('option')
    .map((option) => option.text());
const echo: MockHandler = ({ body }) => ok(profile(body as object));

async function openProfile(profileOverrides = {}, routes: Record<string, MockHandler> = {}) {
  const calls = mockApi({
    ...settingsRoutes({}, profileOverrides),
    'PATCH /profile': echo,
    ...routes,
  });
  const { wrapper } = await mountApp('/settings');
  return { wrapper, calls };
}
const save = async (wrapper: VueWrapper) => {
  await wrapper.get('button[type="submit"]').trigger('submit');
  await flushPromises();
};

describe('Settings › Profile defaults', () => {
  it('offers the languages a submission can be typed in, with the stored one selected', async () => {
    const { wrapper } = await openProfile({ languageId: CPP17_ID });
    expect(optionTexts(wrapper, 'languageId')).toEqual(['C++17', 'Python 3']);
    expect(select(wrapper, 'languageId').element.value).toBe(CPP17_ID);
  });

  it('saves a new default language', async () => {
    const { wrapper, calls } = await openProfile({ languageId: CPP17_ID });
    await select(wrapper, 'languageId').setValue(PY3_ID);
    await save(wrapper);
    expect(patches(calls)).toEqual([{ languageId: PY3_ID }]);
  });

  it('shows "not chosen" for an account without a language, and never sends an empty one', async () => {
    const { wrapper, calls } = await openProfile({ languageId: null });
    expect(optionTexts(wrapper, 'languageId')[0]).toBe('Chưa chọn');
    await wrapper.get('input[name="firstName"]').setValue('Thư');
    await save(wrapper);
    expect(patches(calls)).toEqual([{ firstName: 'Thư' }]);
  });

  it('labels the stored time zone with its offset and saves a new one', async () => {
    const { wrapper, calls } = await openProfile({ timezone: 'Asia/Ho_Chi_Minh' });
    const timezone = select(wrapper, 'timezone');
    expect(timezone.find('option:checked').text()).toBe('Asia/Ho_Chi_Minh (UTC+7)');
    await timezone.setValue('Asia/Tokyo');
    await save(wrapper);
    expect(patches(calls)).toEqual([{ timezone: 'Asia/Tokyo' }]);
  });

  it('puts a refused time zone error under the select, in Vietnamese', async () => {
    const { wrapper } = await openProfile(
      {},
      {
        'PATCH /profile': invalid(
          issue('timezone', 'is_time_zone', 'timezone must be a valid IANA timezone'),
        ),
      },
    );
    await select(wrapper, 'timezone').setValue('Asia/Tokyo');
    await save(wrapper);
    expect(select(wrapper, 'timezone').attributes('aria-invalid')).toBe('true');
    expect(wrapper.text()).toContain('Múi giờ không hợp lệ.');
    expect(document.activeElement).toBe(wrapper.get('#main [role="alert"]').element);
  });

  it('puts a refused language error under the language select, in Vietnamese', async () => {
    const { wrapper } = await openProfile(
      { languageId: CPP17_ID },
      {
        'PATCH /profile': invalid(
          issue('languageId', 'unknown_language', 'languageId must be an existing language'),
        ),
      },
    );
    await select(wrapper, 'languageId').setValue(PY3_ID);
    await save(wrapper);
    expect(select(wrapper, 'languageId').attributes('aria-invalid')).toBe('true');
    expect(wrapper.text()).toContain('Ngôn ngữ này không còn trên trang.');
    expect(document.activeElement).toBe(wrapper.get('#main [role="alert"]').element);
  });

  it('switches the interface language at once, on this device only: no request, nothing to save', async () => {
    const { wrapper, calls } = await openProfile();
    await select(wrapper, 'locale').setValue('en');
    expect(document.documentElement.lang).toBe('en');
    expect(patches(calls)).toEqual([]);
    expect(wrapper.text()).toContain('No unsaved changes.');
    expect(localStorage.getItem('qhhoj.locale')).toBe('en');
  });
});
