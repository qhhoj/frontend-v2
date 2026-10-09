import type { Schemas } from '../schemas';
import type { QueryOf, StreamData } from '../typed';

/** backend: notifications/core/dto/notification.response.ts (NotificationResponse) */
export type NotificationItem = Schemas['NotificationResponse'];
/** backend: notification.response.ts (UnreadCountResponse) */
export type UnreadCount = Schemas['UnreadCountResponse'];
export type NotificationListQuery = QueryOf<'/notifications'>;
export type NotificationState = NonNullable<NotificationListQuery['state']>;
/** backend: notifications/streams/dto/notification-frame.response.ts: ids only. */
export type NotificationNudge = StreamData<'/events/user', 'notification'>;

/** backend: libs/community NOTIFICATIONS_PAGE_SIZE */
export const NOTIFICATIONS_PAGE_SIZE = 20;
export const NOTIFICATION_STATES = [
  'all',
  'unread',
  'read',
] as const satisfies readonly NotificationState[];
