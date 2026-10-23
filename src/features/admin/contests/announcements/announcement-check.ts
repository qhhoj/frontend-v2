import { translate } from '@/i18n';
import type { FieldErrors } from '../../ui/admin-errors';

/** The backend's `ANNOUNCEMENT_TITLE_MAX`: a title is 1 to this many characters. */
export const ANNOUNCEMENT_TITLE_MAX = 100;

/** The draft's field errors before any request; the body may be empty. */
export function checkAnnouncementDraft(draft: { title: string }): FieldErrors {
  const length = draft.title.trim().length;
  return length >= 1 && length <= ANNOUNCEMENT_TITLE_MAX
    ? {}
    : { title: translate('admin.contests.announcements.titleError') };
}
