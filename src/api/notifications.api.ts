import { apiGet, apiGetPage, apiSend } from './typed';
import type { NotificationListQuery } from './types/notifications';

/** The viewer's own inbox, newest activity first. `kind` repeats as `kind=a&kind=b`. */
export const fetchNotifications = (query: NotificationListQuery) =>
  apiGetPage('/notifications', { query });
/** `no-cache`: the backend sends `Cache-Control: private, max-age=15`; a refetch after "mark read" or a nudge must not get the old number. */
export const fetchUnreadCount = () => apiGet('/notifications/unread-count', { cache: 'no-cache' });
/** 204; under impersonation the backend changes nothing (callers do not send it then). */
export const markNotificationRead = (id: string) =>
  apiSend('post', '/notifications/{id}/read', { path: { id } });
export const markAllNotificationsRead = () => apiSend('post', '/notifications/read-all');
