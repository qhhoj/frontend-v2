import { describe, expect, it } from 'vitest';
import { checkAnnouncementDraft } from './announcement-check';

describe('checkAnnouncementDraft', () => {
  it('accepts a title of 1 to 100 characters', () => {
    expect(checkAnnouncementDraft({ title: 'a' })).toEqual({});
    expect(checkAnnouncementDraft({ title: 'a'.repeat(100) })).toEqual({});
  });
  it('states the limit for an empty, blank or 101-character title', () => {
    for (const title of ['', '   ', 'a'.repeat(101)])
      expect(checkAnnouncementDraft({ title }).title, JSON.stringify(title.length)).toBe(
        'Tiêu đề từ 1 đến 100 ký tự.',
      );
  });
});
