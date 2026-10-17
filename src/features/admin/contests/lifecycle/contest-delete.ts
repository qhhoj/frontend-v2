import { translate } from '@/i18n';

/**
 * Why a contest may not be deleted, or undefined when the delete may be offered: the backend refuses a visible one. An
 * unknown visibility counts as visible. The other refusals (rated, still judging) come back from the server.
 */
export const deleteBlockedBy = (isVisible: boolean | undefined): string | undefined =>
  (isVisible ?? true) ? translate('admin.contestOps.delete.visible') : undefined;
