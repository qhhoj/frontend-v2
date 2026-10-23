import { i18n, translate } from '@/i18n';

/** The human name of a permission codename (`judge.delete_problem` → "Xóa bài") from `admin.permissions`; null for a codename without one. */
export function permissionLabel(codename: string): string | null {
  const key = `admin.permissions.${codename}`;
  return i18n.global.te(key) ? translate(key) : null;
}

/**
 * The names of the permissions a screen asks for, in the order given; a codename with no name is left out, so visible text
 * never shows a raw codename. Empty when none has a name (the page then says only that a suitable admin right is needed).
 */
export const permissionLabels = (codenames: readonly string[]): string[] =>
  codenames.flatMap((codename) => permissionLabel(codename) ?? []);
