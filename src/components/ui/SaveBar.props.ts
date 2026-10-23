/** `SaveBar`'s props; `AdminSaveBar` takes the same. */
export interface SaveBarProps {
  dirtyCount: number;
  pending?: boolean;
  savedAt?: Date | string | null;
  allowClean?: boolean;
  blockedReason?: string;
  /** Unsaved changes this bar does not save but the page's leave guard counts, shown after the status ("Tiếng Việt: 1 thay đổi chưa lưu"). */
  note?: string;
  saveLabel?: string;
  form?: string;
  variant?: 'page' | 'footer';
  /** Below `sm` the bar shows only with something to say (a change, a save, a status), so it never covers a field while idle. */
  hideIdleOnPhone?: boolean;
  /** The time zone of "Đã lưu lúc 14:02"; the site's by default (admin), the viewer's own on their settings. */
  timeZone?: string;
}

/** How long "Đã lưu lúc 14:02" stays before the bar goes back to its resting text. */
export const SAVED_NOTE_MS = 3000;
