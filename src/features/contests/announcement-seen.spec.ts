import { beforeEach, describe, expect, it, vi } from 'vitest';
import { announcement } from '@/test/fixtures';
import {
  closedAlertMarks,
  isUnread,
  loadSeenAnnouncement,
  markAnnouncementsSeen,
  seenAnnouncementId,
} from './announcement-seen';

const VIEWER = 'user-a';

describe('announcement read state', () => {
  beforeEach(() => localStorage.clear());

  it('never moves the mark backwards and keeps contests apart', () => {
    markAnnouncementsSeen(VIEWER, 'r42', announcement(5).id);
    markAnnouncementsSeen(VIEWER, 'r42', announcement(3).id);
    expect(seenAnnouncementId(VIEWER, 'r42')).toBe(announcement(5).id);
    loadSeenAnnouncement(VIEWER, 'r41');
    expect(seenAnnouncementId(VIEWER, 'r41')).toBe('');
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

  it('keeps closed alerts apart from read marks, across a reload', () => {
    closedAlertMarks.raise(VIEWER, 'r45', announcement(4).id);
    loadSeenAnnouncement(VIEWER, 'r45');
    expect(seenAnnouncementId(VIEWER, 'r45')).toBe('');
    localStorage.setItem(
      'qhhoj.contest-announcement-alert-closed.' + VIEWER + ':r45',
      announcement(6).id,
    );
    closedAlertMarks.load(VIEWER, 'r45');
    expect(closedAlertMarks.get(VIEWER, 'r45')).toBe(announcement(6).id);
  });
});
