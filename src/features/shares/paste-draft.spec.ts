import { afterEach, describe, expect, it } from 'vitest';
import { PASTE_DRAFT_KEY, clearDraft, loadDraft, parseDraft, saveDraft } from './paste-draft';

afterEach(() => window.localStorage.clear());

describe('paste draft', () => {
  it('comes back as it was saved, so a sign-in in between loses nothing', () => {
    saveDraft({ source: 'print(1)', title: 'one', languageId: 'py', expiry: '7d', userId: null });
    expect(loadDraft(null)).toEqual({
      source: 'print(1)',
      title: 'one',
      languageId: 'py',
      expiry: '7d',
      userId: null,
    });
  });

  it('keeps nothing for an empty draft, and clearing removes it', () => {
    saveDraft({ source: '', title: '', languageId: 'py', expiry: '7d', userId: null });
    expect(window.localStorage.getItem(PASTE_DRAFT_KEY)).toBeNull();
    saveDraft({ source: 'x', title: '', languageId: null, expiry: null, userId: null });
    clearDraft();
    expect(window.localStorage.getItem(PASTE_DRAFT_KEY)).toBeNull();
  });

  it("does not give one account's draft to another, but gives a visitor's to whoever signs in", () => {
    saveDraft({ source: 'x', title: '', languageId: null, expiry: null, userId: 'a' });
    expect(loadDraft('b').source).toBe('');
    expect(loadDraft('a').source).toBe('x');
    saveDraft({ source: 'y', title: '', languageId: null, expiry: null, userId: null });
    expect(loadDraft('b').source).toBe('y');
  });

  it('keeps only the fields of the right type from stored data', () => {
    const stored = JSON.stringify({
      source: 5,
      title: 'ok',
      languageId: 7,
      expiry: 'forever',
      userId: 3,
    });
    expect(parseDraft(stored)).toEqual({
      source: '',
      title: 'ok',
      languageId: null,
      expiry: null,
      userId: null,
    });
  });

  it.each([null, 'not json', '42', 'null'])('reads %s as an empty draft', (raw) => {
    expect(parseDraft(raw)).toEqual({
      source: '',
      title: '',
      languageId: null,
      expiry: null,
      userId: null,
    });
  });
});
