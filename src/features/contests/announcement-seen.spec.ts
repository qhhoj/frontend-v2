import { beforeEach, describe, expect, it } from 'vitest';
import { announcement } from '@/test/fixtures';
import {
  isUnread,
  loadSeenAnnouncement,
  markAnnouncementsSeen,
  seenAnnouncementId,
} from './announcement-seen';

describe('announcement read state', () => {
  beforeEach(() => localStorage.clear());

  it('treats everything as unread before the first visit, and later ids as unread after it', () => {
    loadSeenAnnouncement('r42');
    expect(isUnread(announcement(1), seenAnnouncementId('r42'))).toBe(true);
    markAnnouncementsSeen('r42', announcement(2).id);
    expect(isUnread(announcement(2), seenAnnouncementId('r42'))).toBe(false);
    expect(isUnread(announcement(3), seenAnnouncementId('r42'))).toBe(true);
  });

  it('never moves the mark backwards and keeps contests apart', () => {
    markAnnouncementsSeen('r42', announcement(5).id);
    markAnnouncementsSeen('r42', announcement(3).id);
    expect(seenAnnouncementId('r42')).toBe(announcement(5).id);
    loadSeenAnnouncement('r41');
    expect(seenAnnouncementId('r41')).toBe('');
  });

  it('survives a reload through storage', () => {
    markAnnouncementsSeen('r40', announcement(4).id);
    expect(localStorage.getItem('qhhoj.contest-announcements-seen.r40')).toBe(announcement(4).id);
  });
});
