/** `SaveBar`'s props; `AdminSaveBar` takes the same. */
export interface SaveBarProps {
  dirtyCount: number;
  pending?: boolean;
  savedAt?: Date | string | null;
  allowClean?: boolean;
  blockedReason?: string;
  saveLabel?: string;
  form?: string;
  variant?: 'page' | 'footer';
}

/** How long "Đã lưu lúc 14:02" stays before the bar goes back to its resting text. */
export const SAVED_NOTE_MS = 3000;
