import { PASTE_MAX_BYTES } from '@/api/types/shares';
import { formatFileSize } from '@/lib/format';
import { sourceLineCount } from '@/lib/source';

const encoder = new TextEncoder();

export interface PasteSize {
  bytes: number;
  lines: number;
  isTooLarge: boolean;
  isEmpty: boolean;
}

/** The counter under the editor: the backend counts UTF-8 bytes, not characters. */
export function pasteSize(source: string): PasteSize {
  const bytes = encoder.encode(source).length;
  return {
    bytes,
    lines: source === '' ? 0 : sourceLineCount(source),
    isTooLarge: bytes > PASTE_MAX_BYTES,
    isEmpty: source.trim() === '',
  };
}

/** "132 B": under a KiB in bytes, else the file-size text. */
export const sizeText = (bytes: number) => (bytes < 1024 ? `${bytes} B` : formatFileSize(bytes));
