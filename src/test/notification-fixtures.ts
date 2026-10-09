import type { NotificationItem } from '../api/types/notifications';
import { communityId } from './community-fixtures';

/** The clock of every notification test: 9 Oct 2026, 10:00 UTC (17:00 in Hanoi). */
export const NOTIFICATION_NOW = new Date('2026-10-09T10:00:00Z');
export const NOTIFIED_TICKET_ID = communityId(801);

export const notificationItem = (overrides: Partial<NotificationItem> = {}): NotificationItem => ({
  id: communityId(701),
  kind: 'ticket-message',
  title: 'Phiếu hỗ trợ có trả lời mới',
  body: 'colan: Đã sửa: đáp án với n = 1 là 0.',
  path: `/tickets/${NOTIFIED_TICKET_ID}`,
  priority: 'high',
  count: 3,
  unread: true,
  readAt: null,
  createdAt: '2026-10-09T09:20:00Z',
  lastActivityAt: '2026-10-09T09:58:00Z',
  ...overrides,
});

/** The board's inbox: three unread today, one read yesterday, one read old row whose ticket is gone. */
const unreadSample = (): NotificationItem[] => [
  notificationItem(),
  notificationItem({
    id: communityId(702),
    kind: 'contest-announcement',
    title: 'Thông báo kỳ thi · QHH Round #42',
    body: 'Đề bài C đã được chỉnh sửa ở mục Giới hạn.',
    path: '/contests/r42',
    count: 1,
    lastActivityAt: '2026-10-09T09:45:00Z',
  }),
  notificationItem({
    id: communityId(703),
    kind: 'ticket-status',
    title: 'Phiếu 0192a7 đã được đóng',
    body: 'thayhung đã đóng phiếu.',
    priority: 'normal',
    count: 1,
    lastActivityAt: '2026-10-09T09:00:00Z',
  }),
];

const readSample = (): NotificationItem[] => [
  notificationItem({
    id: communityId(704),
    kind: 'organization-request-decided',
    title: 'Yêu cầu vào THPT Chuyên Lê Hồng Phong đã được duyệt',
    body: 'Bạn hiện là thành viên của tổ chức.',
    path: '/organizations/lhp',
    priority: 'normal',
    count: 1,
    unread: false,
    readAt: '2026-10-08T12:00:00Z',
    lastActivityAt: '2026-10-08T11:05:00Z',
  }),
  notificationItem({
    id: communityId(705),
    title: 'Phiếu hỗ trợ có trả lời mới',
    body: 'Mở để xem nội dung.',
    path: `/tickets/${communityId(899)}`,
    priority: 'normal',
    count: 1,
    unread: false,
    readAt: '2026-10-03T08:00:00Z',
    lastActivityAt: '2026-10-03T07:00:00Z',
  }),
];

export const inboxSample = (): NotificationItem[] => [...unreadSample(), ...readSample()];
