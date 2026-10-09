import type { SettingRevision } from '@/api/types/settings-admin';
import { translate } from '@/i18n';
import type { SettingKind } from './setting-blocks';

const isSealed = (value: unknown): value is { set: boolean } =>
  typeof value === 'object' && value !== null && Object.keys(value).length === 1 && 'set' in value;

/** A sealed side says only whether a value was set; a missing side (the first revision) reads as the default. */
function showValue(value: unknown): string {
  if (value === undefined) return translate('admin.settings.values.default');
  if (isSealed(value))
    return translate(value.set ? 'admin.settings.values.set' : 'admin.settings.values.unset');
  return typeof value === 'string' ? value : JSON.stringify(value);
}

/** A scalar key keeps its one value under `value`; a multi-field key keeps a map of its fields. */
const fieldOf = (side: unknown, field: string) =>
  field === 'value' ? side : (side as Record<string, unknown> | null)?.[field];

export const diffLines = (revision: SettingRevision) =>
  revision.changedFields.map((field) => ({
    field,
    before: showValue(fieldOf(revision.before, field)),
    after: showValue(fieldOf(revision.after, field)),
  }));

/** A whole secret can never be restored (the server answers 409), so the panel does not offer the button for it. */
export const isRestorable = (kind: SettingKind) =>
  kind.kind !== 'secretText' && kind.kind !== 'webhooks';
