import { createI18n } from 'vue-i18n';
import { SHARED_ADMIN_MESSAGES } from './admin-messages';
import en from './en.json';
import vi from './vi.json';

export const LOCALES = ['vi', 'en'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'vi';
export const isLocale = (value: unknown): value is Locale => LOCALES.includes(value as Locale);

export const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  locale: DEFAULT_LOCALE,
  fallbackLocale: DEFAULT_LOCALE,
  messages: {
    vi: { ...vi, admin: SHARED_ADMIN_MESSAGES.vi },
    en: { ...en, admin: SHARED_ADMIN_MESSAGES.en },
  },
});

/** Script-side translation; templates use `$t`. */
export const translate = i18n.global.t;

let adminMessagesLoad: Promise<void> | null = null;

/** Adds the admin-only areas to both locales once (vi is the fallback); a failed download is retried on the next call. */
export function loadAdminMessages(): Promise<void> {
  adminMessagesLoad ??= import('./admin-only-messages').then(
    ({ ADMIN_ONLY_MESSAGES }) => {
      for (const locale of LOCALES)
        i18n.global.mergeLocaleMessage(locale, { admin: ADMIN_ONLY_MESSAGES[locale] });
    },
    (error: unknown) => {
      adminMessagesLoad = null;
      throw error;
    },
  );
  return adminMessagesLoad;
}
