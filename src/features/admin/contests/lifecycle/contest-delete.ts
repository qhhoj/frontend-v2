import { translate } from '@/i18n';

/** The backend refuses to delete a visible contest: the reason, or undefined when the delete may be offered. */
export const deleteBlockedBy = (isVisible: boolean): string | undefined =>
  isVisible ? translate('admin.contestOps.delete.visible') : undefined;
