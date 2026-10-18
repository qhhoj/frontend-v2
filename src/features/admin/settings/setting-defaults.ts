import type { Setting } from '@/api/types/settings-admin';
import { translate } from '@/i18n';
import type { Locale } from '@/i18n';
import { formatNumber } from '@/lib/format';
import { SETTING_KINDS } from './setting-blocks';
import type { SettingKind } from './setting-blocks';
import type { ScalarDraft, SettingDraft } from './setting-values';

const sameValue = (left: unknown, right: unknown) => JSON.stringify(left) === JSON.stringify(right);

/** The kinds that hold one plain value (`ScalarSettingField`): only those have a default a box can take. */
const SCALAR_KINDS: readonly SettingKind['kind'][] = [
  'timeZone',
  'boolean',
  'integer',
  'text',
  'choice',
  'url',
];

/** A secret's `default` reads `{ set: false }`, and OAuth or webhook values are no single box: only plain settings can be reset. */
export const canResetToDefault = (setting: Setting) =>
  !setting.hasSecret && SCALAR_KINDS.includes(SETTING_KINDS[setting.key].kind);

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
