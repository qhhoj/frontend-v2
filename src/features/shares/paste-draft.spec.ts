import { afterEach, describe, expect, it } from 'vitest';
import { PASTE_DRAFT_KEY, clearDraft, loadDraft, parseDraft, saveDraft } from './paste-draft';

afterEach(() => window.localStorage.clear());

describe('paste draft', () => {
  it('comes back as it was saved, so a sign-in in between loses nothing', () => {
    saveDraft({ source: 'print(1)', title: 'one', languageId: 'py', expiry: '7d' });
    expect(loadDraft()).toEqual({
      source: 'print(1)',
      title: 'one',
      languageId: 'py',
      expiry: '7d',
    });
  });

  it('keeps nothing for an empty draft, and clearing removes it', () => {
    saveDraft({ source: '', title: '', languageId: 'py', expiry: '7d' });
    expect(window.localStorage.getItem(PASTE_DRAFT_KEY)).toBeNull();
    saveDraft({ source: 'x', title: '', languageId: null, expiry: null });
    clearDraft();
    expect(window.localStorage.getItem(PASTE_DRAFT_KEY)).toBeNull();
  });

  it('keeps only the fields of the right type from stored data', () => {
    const stored = JSON.stringify({ source: 5, title: 'ok', languageId: 7, expiry: 'forever' });
    expect(parseDraft(stored)).toEqual({ source: '', title: 'ok', languageId: null, expiry: null });
  });

  it.each([null, 'not json', '42', 'null'])('reads %s as an empty draft', (raw) => {
    expect(parseDraft(raw)).toEqual({ source: '', title: '', languageId: null, expiry: null });
  });
});
