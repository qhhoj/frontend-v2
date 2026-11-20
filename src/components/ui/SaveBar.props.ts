/** One part of a page with unsaved changes: the name the page shows for it and its count of changes. */
export interface SaveBarChangedPart {
  label: string;
  count: number;
}

/** `SaveBar`'s props; `AdminSaveBar` takes the same. */
export interface SaveBarProps {
  dirtyCount: number;
  pending?: boolean;
  savedAt?: Date | string | null;
  allowClean?: boolean;
  blockedReason?: string;
  /** Unsaved changes this bar does not save but the page's leave guard counts, shown after the status ("Tiếng Việt: 1 thay đổi chưa lưu"). */
  note?: string;
  /** The parts of the page that hold the unsaved changes, with how many each: shown after the status as "Thông tin 2 · Đề bài 1". */
  changedParts?: readonly SaveBarChangedPart[];
  /** What applies at once, without Save (instant toggles on the same page), shown after the status in the muted style. */
  immediateNote?: string;
  saveLabel?: string;
  form?: string;
  variant?: 'page' | 'footer';
  /** The time zone of "Đã lưu lúc 14:02"; the site's by default (admin), the viewer's own on their settings. */
  timeZone?: string;
}

/** How long "Đã lưu lúc 14:02" stays before the bar goes back to its resting text. */
export const SAVED_NOTE_MS = 3000;
