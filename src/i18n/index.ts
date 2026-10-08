import { createI18n } from 'vue-i18n';
import { ADMIN_MESSAGES } from './admin-messages';
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
  messages: { vi: { ...vi, admin: ADMIN_MESSAGES.vi }, en: { ...en, admin: ADMIN_MESSAGES.en } },
});

/** Script-side translation; templates use `$t`. */
export const translate = i18n.global.t;
