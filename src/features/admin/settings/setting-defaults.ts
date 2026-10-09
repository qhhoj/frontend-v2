import type { Setting } from '@/api/types/settings-admin';
import { translate } from '@/i18n';
import type { Locale } from '@/i18n';
import { formatNumber } from '@/lib/format';
import type { ScalarDraft, SettingDraft } from './setting-values';

const sameValue = (left: unknown, right: unknown) => JSON.stringify(left) === JSON.stringify(right);

/** A secret's `default` reads `{ set: false }`: not a value anyone can send, so only plain settings can be reset. */
export const canResetToDefault = (setting: Setting) => !setting.hasSecret;

export const defaultDraftOf = (setting: Setting): ScalarDraft => ({ value: setting.default });

export const isAtDefault = (setting: Setting, draft: SettingDraft) =>
  sameValue((draft as ScalarDraft).value, setting.default);

/** The box holds the default but the stored value is another: the page says it is not saved yet. */
export const isFilledFromDefault = (setting: Setting, draft: SettingDraft) =>
  canResetToDefault(setting) && isAtDefault(setting, draft) && !setting.isDefault;

export function valueText(value: unknown, locale: Locale): string {
  if (typeof value === 'number') return formatNumber(value, locale);
  if (typeof value === 'boolean')
    return translate(value ? 'admin.settings.reset.on' : 'admin.settings.reset.off');
  return value === '' ? translate('admin.settings.reset.empty') : String(value);
}
