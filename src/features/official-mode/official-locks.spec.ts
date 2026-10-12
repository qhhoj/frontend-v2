import { flushPromises } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { settingsRoutes } from '@/test/account-routes';
import { profileOrganization, sessionUser } from '@/test/fixtures';
import { mockApi, ok } from '@/test/mock-api';
import { mountApp } from '@/test/mount';

const LHP = profileOrganization();
const CLB = profileOrganization({
  id: '0192a000-0000-7000-8000-0000000001a2',
  slug: 'clb',
  name: 'CLB Tin học',
  shortName: 'CLB',
});
const site = (officialMode: boolean) => ({
  'GET /site': ok({ config: {}, officialMode }),
});
async function openSettings(officialMode: boolean, isSuperuser = false) {
  const calls = mockApi({
    ...settingsRoutes({ user: sessionUser({ isSuperuser }) }, { organizations: [LHP, CLB] }),
    ...site(officialMode),
  });
  const { wrapper } = await mountApp('/settings');
  return { wrapper, calls };
}

describe('official contest locks in profile settings', () => {
  it('locks reordering and leaving, keeps the order and shows the note on the profile card', async () => {
    const { wrapper } = await openSettings(true);
    const down = wrapper.get(`[aria-label="Chuyển ${LHP.name} xuống"]`);
    expect(down.attributes('aria-disabled')).toBe('true');
    expect(down.attributes('aria-describedby')).toBe(
      wrapper.get('[data-testid="official-lock-note"]').attributes('id'),
    );
    await down.trigger('click');
    await flushPromises();
    expect(
      wrapper.findAll('ul[aria-label="Tổ chức của bạn"] li strong').map((name) => name.text()),
    ).toEqual([LHP.name, CLB.name]);
    expect(wrapper.text()).toContain(
      'Trong kỳ thi chính thức, tên, phần giới thiệu và thứ tự tổ chức tạm khóa',
    );
  });

  it('locks nothing for a superuser or while the mode is off', async () => {
    for (const [officialMode, isSuperuser] of [
      [true, true],
      [false, false],
    ] as const) {
      const { wrapper } = await openSettings(officialMode, isSuperuser);
      expect(
        wrapper.get(`[aria-label="Chuyển ${LHP.name} xuống"]`).attributes('aria-disabled'),
      ).not.toBe('true');
      expect(wrapper.find('[data-testid="official-lock-note"]').exists()).toBe(false);
      wrapper.unmount();
    }
  });
});
