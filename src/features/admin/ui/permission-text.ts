import { i18n, translate } from '@/i18n';

/**
 * "Cần quyền <human name>" for a permission codename (`judge.change_public_visibility`), from `admin.permissions`; an
 * unknown codename falls back to itself. Visible text never shows the codename (pages/admin.md, copy rules).
 */
export function needsPermissionText(codename: string): string {
  const key = `admin.permissions.${codename}`;
  const name = i18n.global.te(key) ? translate(key) : codename;
  return translate('admin.form.needsPermission', { permission: name });
}
