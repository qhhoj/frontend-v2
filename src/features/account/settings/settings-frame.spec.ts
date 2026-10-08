import { describe, expect, it } from 'vitest';
import { settingsRoutes } from '@/test/account-routes';
import { signedOut } from '@/test/fixtures';
import { mockApi } from '@/test/mock-api';
import { mountApp, mountComponent } from '@/test/mount';
import SettingsCard from './SettingsCard.vue';
import SettingsNotice from './SettingsNotice.vue';

const sectionNav = '#main nav[aria-label="Các mục cài đặt"]';

describe('settings frame', () => {
  it('titles the page, marks the current section and links all four', async () => {
    mockApi(settingsRoutes());
    const { wrapper } = await mountApp('/settings/security');
    expect(document.title).toBe('Cài đặt bảo mật · QHHOJ');
    expect(wrapper.get('#main h1').text()).toBe('Cài đặt');
    const links = wrapper.get(sectionNav).findAll('a');
    expect(links.map((link) => link.text())).toEqual(['Hồ sơ', 'Giao diện', 'Bảo mật', 'Dữ liệu']);
    expect(links.map((link) => link.attributes('href'))).toEqual([
      '/settings',
      '/settings/appearance',
      '/settings/security',
      '/settings/data',
    ]);
    expect(links.map((link) => link.attributes('aria-current') ?? null)).toEqual([
      null,
      null,
      'page',
      null,
    ]);
    const crumbs = wrapper.get('#main nav[aria-label="Đường dẫn"]');
    expect(crumbs.get('a').attributes('href')).toBe('/settings');
    expect(crumbs.get('[aria-current="page"]').text()).toBe('Bảo mật');
  });

  it('keeps /settings as the profile section', async () => {
    mockApi(settingsRoutes());
    const { wrapper } = await mountApp('/settings');
    expect(document.title).toBe('Cài đặt hồ sơ · QHHOJ');
    expect(wrapper.get(`${sectionNav} [aria-current="page"]`).text()).toBe('Hồ sơ');
  });

  it('shows an anonymous visitor the appearance page in the frame, without sections they cannot open', async () => {
    mockApi({ 'GET /auth/me': signedOut });
    const { wrapper } = await mountApp('/settings/appearance');
    expect(wrapper.get('#main h1').text()).toBe('Cài đặt');
    expect(wrapper.find(sectionNav).exists()).toBe(false);
    expect(wrapper.get('#main nav[aria-label="Đường dẫn"]').find('a').exists()).toBe(false);
  });
});

describe('SettingsNotice', () => {
  it.each([
    ['error', 'alert'],
    ['success', 'status'],
    ['warning', null],
    ['info', null],
  ] as const)('a %s notice has role %s', (tone, role) => {
    const wrapper = mountComponent(SettingsNotice, {
      props: { tone },
      slots: { default: 'Nội dung' },
    });
    expect(wrapper.text()).toContain('Nội dung');
    expect(wrapper.attributes('role') ?? null).toBe(role);
  });

  it('shows Bit instead of the icon when asked, decoratively', () => {
    const wrapper = mountComponent(SettingsNotice, {
      props: { tone: 'success', bit: 'crown' },
      slots: { default: 'Đã lưu hồ sơ.' },
    });
    expect(wrapper.get('[data-testid="inline-bit"]').attributes('aria-hidden')).toBe('true');
    expect(wrapper.find('svg.lucide').exists()).toBe(false);
  });

  it('takes the moving padlock Bit as well as the still moods', () => {
    const wrapper = mountComponent(SettingsNotice, {
      props: { tone: 'warning', bit: 'security' },
      slots: { default: 'Đang bị khoá.' },
    });
    expect(wrapper.get('[data-testid="inline-bit"]').attributes('aria-hidden')).toBe('true');
    expect(wrapper.find('[data-testid="inline-bit"][data-frame]').exists()).toBe(true); // a loop, not a still mood
    expect(wrapper.find('svg.lucide').exists()).toBe(false);
  });

  it('puts the action after the message', () => {
    const wrapper = mountComponent(SettingsNotice, {
      props: { tone: 'error' },
      slots: { default: 'Mất kết nối.', action: '<button type="button">Thử lại</button>' },
    });
    expect(wrapper.text()).toBe('Mất kết nối.Thử lại');
  });
});

describe('SettingsCard', () => {
  it('names its section by its h2 heading, with the lead under it', () => {
    const top = mountComponent(SettingsCard, {
      props: { title: 'Mật khẩu' },
      slots: { default: '<p>Nội dung</p>' },
    });
    expect(top.get('h2').text()).toBe('Mật khẩu');
    expect(top.attributes('aria-labelledby')).toBe(top.get('h2').attributes('id'));
    const withLead = mountComponent(SettingsCard, {
      props: { title: 'Bước 1', lead: 'Giải thích ngắn' },
    });
    expect(withLead.get('h2').text()).toBe('Bước 1');
    expect(withLead.text()).toContain('Giải thích ngắn');
  });
});
