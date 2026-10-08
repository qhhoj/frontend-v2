import { beforeEach, describe, expect, it, vi } from 'vitest';
import { announcement } from '@/test/fixtures';
import {
  isUnread,
  loadSeenAnnouncement,
  markAnnouncementsSeen,
  seenAnnouncementId,
} from './announcement-seen';

const VIEWER = 'user-a';

describe('announcement read state', () => {
  beforeEach(() => localStorage.clear());

  it('treats everything as unread before the first visit, and later ids as unread after it', () => {
    loadSeenAnnouncement(VIEWER, 'r42');
    expect(isUnread(announcement(1), seenAnnouncementId(VIEWER, 'r42'))).toBe(true);
    markAnnouncementsSeen(VIEWER, 'r42', announcement(2).id);
    expect(isUnread(announcement(2), seenAnnouncementId(VIEWER, 'r42'))).toBe(false);
    expect(isUnread(announcement(3), seenAnnouncementId(VIEWER, 'r42'))).toBe(true);
  });

  it('never moves the mark backwards and keeps contests apart', () => {
    markAnnouncementsSeen(VIEWER, 'r42', announcement(5).id);
    markAnnouncementsSeen(VIEWER, 'r42', announcement(3).id);
    expect(seenAnnouncementId(VIEWER, 'r42')).toBe(announcement(5).id);
    loadSeenAnnouncement(VIEWER, 'r41');
    expect(seenAnnouncementId(VIEWER, 'r41')).toBe('');
  });

  it('survives a reload through storage', () => {
    markAnnouncementsSeen(VIEWER, 'r40', announcement(4).id);
    expect(localStorage.getItem('qhhoj.contest-announcements-seen.user-a:r40')).toBe(
      announcement(4).id,
    );
  });

  it("keeps each viewer's marks apart on the same browser", () => {
    markAnnouncementsSeen('user-a', 'r44', announcement(5).id);
    loadSeenAnnouncement('user-b', 'r44');
    expect(seenAnnouncementId('user-b', 'r44')).toBe('');
    expect(isUnread(announcement(5), seenAnnouncementId('user-b', 'r44'))).toBe(true);
    expect(localStorage.getItem('qhhoj.contest-announcements-seen.user-b:r44')).toBeNull();
    loadSeenAnnouncement('user-a', 'r44');
    expect(seenAnnouncementId('user-a', 'r44')).toBe(announcement(5).id);
  });

  it('keeps a mark that storage refused for the rest of the session', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota exceeded');
    });
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage blocked');
    });
    try {
      markAnnouncementsSeen(VIEWER, 'r43', announcement(7).id);
      loadSeenAnnouncement(VIEWER, 'r43');
      expect(seenAnnouncementId(VIEWER, 'r43')).toBe(announcement(7).id);
    } finally {
      vi.restoreAllMocks();
    }
  });
});
