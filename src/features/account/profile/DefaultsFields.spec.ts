import { flushPromises } from '@vue/test-utils';
import type { VueWrapper } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { settingsRoutes } from '@/test/account-routes';
import { profile } from '@/test/fixtures';
import { invalid, issue, mockApi, ok } from '@/test/mock-api';
import type { ApiCall, MockHandler } from '@/test/mock-api';
import { mountApp } from '@/test/mount';

const patches = (calls: ApiCall[]) =>
  calls.filter((call) => call.method === 'PATCH').map((call) => call.body);
const select = (wrapper: VueWrapper, name: string) =>
  wrapper.get<HTMLSelectElement>(`select[name="${name}"]`);
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

  it('switches the interface language at once, on this device only: no request, nothing to save', async () => {
    const { wrapper, calls } = await openProfile();
    await wrapper
      .get<HTMLSelectElement>('[data-testid="interface-language"] select')
      .setValue('en');
    expect(document.documentElement.lang).toBe('en');
    expect(patches(calls)).toEqual([]);
    expect(wrapper.text()).toContain('No changes to save.');
    expect(localStorage.getItem('qhhoj.locale')).toBe('en');
  });
});
