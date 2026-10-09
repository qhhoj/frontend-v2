import type { NavigationItem, SiteData } from '../../api/types/site-admin';

/** A navigation entry; `id` and `key` follow `nav-<key>` unless given. */
export const navItem = (overrides: Partial<NavigationItem> = {}): NavigationItem => {
  const key = overrides.key ?? 'home';
  return {
    id: `nav-${key}`,
    key,
    label: key,
    path: `/${key}`,
    regex: '',
    hidden: false,
    order: 0,
    parentId: null,
    ...overrides,
  };
};

/** The board's site: five misc config keys and the navigation bar (a hidden blog child with a broken regex). */
export const siteData = (): SiteData => ({
  config: {
    announcement: '<p>Bảo trì lúc 13:00</p>',
    footer: '<small>© QHHOJ</small>',
    discord_invite_link: 'https://discord.gg/qhhoj',
    analytics: '<script src="https://stats.example/x.js"></script>',
    contact_email: 'hello@qhhoj.example',
  },
  navigation: [
    navItem({ key: 'home', label: 'Trang chủ', order: 1 }),
    navItem({ key: 'problems', label: 'Bài tập', path: '/problems', order: 2 }),
    navItem({ key: 'contests', label: 'Cuộc thi', path: '/contests', order: 3 }),
    navItem({
      key: 'c-virt',
      label: 'Ảo',
      path: '/contests/virtual',
      order: 1,
      parentId: 'nav-contests',
    }),
    navItem({ key: 'ranking', label: 'Xếp hạng', path: '/ranking', order: 4 }),
    navItem({ key: 'blog', label: 'Blog', path: '/blog', order: 5 }),
    navItem({
      key: 'b-org',
      label: 'Tổ chức',
      path: '/organizations',
      order: 1,
      parentId: 'nav-blog',
    }),
    navItem({
      key: 'b-old',
      label: 'Cũ',
      path: '/blog/old',
      regex: '(unclosed',
      hidden: true,
      order: 2,
      parentId: 'nav-blog',
    }),
    navItem({ key: 'help', label: 'Trợ giúp', path: 'https://help.qhhoj.vn', order: 6 }),
  ],
});
