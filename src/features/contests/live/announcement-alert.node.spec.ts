import { describe, expect, it } from 'vitest';
import type { Announcement } from '@/api/types/contests';
import { alertedAnnouncement } from './announcement-alert';

const announcement = (id: string): Announcement => ({
  id,
  title: `t-${id}`,
  description: '',
  descriptionHtml: '',
  createdAt: '2026-10-17T00:00:00Z',
});
const none = () => false;
const closed = (id: string) => (candidate: string) => candidate === id;
const list = [announcement('0003'), announcement('0002'), announcement('0001')];

describe('alertedAnnouncement', () => {
  it('alerts the newest announcement while it is unread', () => {
    expect(alertedAnnouncement(list, '0001', none)?.id).toBe('0003');
    expect(alertedAnnouncement(list, '', none)?.id).toBe('0003');
  });

  it('stops once the newest is read, even when older ones are unread', () => {
    expect(alertedAnnouncement(list, '0003', none)).toBeNull();
  });

  it('stops for a closed announcement and comes back for a newer one', () => {
    expect(alertedAnnouncement(list, '0001', closed('0003'))).toBeNull();
    const newer = [announcement('0004'), ...list];
    expect(alertedAnnouncement(newer, '0001', closed('0003'))?.id).toBe('0004');
  });

  it('alerts nothing for an empty list', () => {
    expect(alertedAnnouncement([], '', none)).toBeNull();
  });
});
