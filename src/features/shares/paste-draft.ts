import type { ShareExpiry } from '@/api/types/shares';
import { SHARE_EXPIRIES } from './share-expiry';

/** What the paste page keeps while a visitor signs in; the key is the only place it lives. */
export interface PasteDraft {
  source: string;
  title: string;
  languageId: string | null;
  expiry: ShareExpiry | null;
}

export const PASTE_DRAFT_KEY = 'qhhoj.paste-draft';
const EMPTY: PasteDraft = { source: '', title: '', languageId: null, expiry: null };

const isExpiry = (value: unknown): value is ShareExpiry =>
  SHARE_EXPIRIES.includes(value as ShareExpiry);

/** A stored draft is data from another tab or version: only the fields of the right type survive. */
export function parseDraft(raw: string | null): PasteDraft {
  if (raw === null) return EMPTY;
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== 'object' || value === null) return EMPTY;
    const record = value as Record<string, unknown>;
    return {
      source: typeof record.source === 'string' ? record.source : '',
      title: typeof record.title === 'string' ? record.title : '',
      languageId: typeof record.languageId === 'string' ? record.languageId : null,
      expiry: isExpiry(record.expiry) ? record.expiry : null,
    };
  } catch {
    return EMPTY;
  }
}

const isEmpty = (draft: PasteDraft) => draft.source === '' && draft.title === '';

/** The browser's storage can be absent or full (private windows): the draft is then simply not kept. */
function storage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function loadDraft(): PasteDraft {
  try {
    return parseDraft(storage()?.getItem(PASTE_DRAFT_KEY) ?? null);
  } catch {
    return EMPTY;
  }
}

/** An empty draft removes the key, so a finished paste leaves nothing behind. */
export function saveDraft(draft: PasteDraft): void {
  try {
    if (isEmpty(draft)) storage()?.removeItem(PASTE_DRAFT_KEY);
    else storage()?.setItem(PASTE_DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // Quota or a blocked storage: the page works without a kept draft.
  }
}

export const clearDraft = () => saveDraft(EMPTY);
