import { describe, expect, it, vi } from 'vitest';
import { ApiError } from './client';
import { fail, mockApi, noContent, ok, page } from '@/test/mock-api';
import {
  fetchNotifications,
  fetchUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
} from './notifications.api';

describe('notifications api', () => {
  it('asks one state, priority and page of the inbox and returns the page', async () => {
    const calls = mockApi({
      'GET /notifications': page([], { page: 2, pageSize: 20, total: 21 }),
    });
    const result = await fetchNotifications({ state: 'unread', priority: 'high', page: 2 });
    expect(calls[0]!.query.get('state')).toBe('unread');
    expect(calls[0]!.query.get('priority')).toBe('high');
    expect(calls[0]!.query.get('page')).toBe('2');
    expect(result.meta.total).toBe(21);
  });

  it('sends the kind filter as repeated query parameters', async () => {
    const calls = mockApi({ 'GET /notifications': page([]) });
    await fetchNotifications({ kind: ['ticket-new', 'ticket-message'] });
    expect(calls[0]!.query.getAll('kind')).toEqual(['ticket-new', 'ticket-message']);
  });

  it('reads the unread count past the HTTP cache', async () => {
    mockApi({ 'GET /notifications/unread-count': ok({ count: 7 }) });
    expect(await fetchUnreadCount()).toEqual({ count: 7 });
    expect(vi.mocked(fetch).mock.calls[0]![1]!.cache).toBe('no-cache');
  });

  it('marks one row read with its id as one encoded segment and resolves nothing', async () => {
    const calls = mockApi({ 'POST /notifications/a%2Fb/read': noContent() });
    await expect(markNotificationRead('a/b')).resolves.toBeUndefined();
    expect(calls[0]!.method).toBe('POST');
  });

  it('marks everything read and surfaces a rate limit as an ApiError', async () => {
    const calls = mockApi({ 'POST /notifications/read-all': fail(429, 'rate_limited') });
    await expect(markAllNotificationsRead()).rejects.toBeInstanceOf(ApiError);
    expect(calls[0]!.path).toBe('/notifications/read-all');
  });
});
