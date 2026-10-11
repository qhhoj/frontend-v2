import { SITE_NOTICE_KEY } from '@/features/site-notice/site-notice';

/** A misc config key the site knows: what it is for (`admin.site.config.known.<key>`) and whether this site version reads it. */
export interface KnownConfigKey {
  key: string;
  /** False: kept from the old site, which read it; this version ignores it. */
  isUsed: boolean;
}

/** Every key with a meaning, the used ones first; any other key is free-form data nothing reads. */
export const KNOWN_CONFIG_KEYS: readonly KnownConfigKey[] = [
  { key: SITE_NOTICE_KEY, isUsed: true },
  { key: 'announcement', isUsed: false },
  { key: 'home_page_top', isUsed: false },
  { key: 'footer', isUsed: false },
  { key: 'analytics', isUsed: false },
  { key: 'meta_description', isUsed: false },
  { key: 'meta_keywords', isUsed: false },
  { key: 'discord_invite_link', isUsed: false },
  { key: 'discord_invite_shieldio', isUsed: false },
];

export const knownConfigKey = (key: string): KnownConfigKey | null =>
  KNOWN_CONFIG_KEYS.find((entry) => entry.key === key) ?? null;
