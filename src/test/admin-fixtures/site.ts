import type { SiteData } from '../../api/types/site-admin';

/** The board's site: five misc config keys. */
export const siteData = (): SiteData => ({
  officialMode: false,
  officialModeEndsAt: null,
  timeZone: 'Asia/Ho_Chi_Minh',
  config: {
    announcement: '<p>Bảo trì lúc 13:00</p>',
    footer: '<small>© QHHOJ</small>',
    discord_invite_link: 'https://discord.gg/qhhoj',
    analytics: '<script src="https://stats.example/x.js"></script>',
    contact_email: 'hello@qhhoj.example',
  },
});
