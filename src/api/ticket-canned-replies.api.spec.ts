import { describe, expect, it, vi } from 'vitest';
import { mockApi, noContent, ok, page } from '@/test/mock-api';
import {
  createCannedReply,
  deleteCannedReply,
  fetchCannedReplies,
  updateCannedReply,
} from './ticket-canned-replies.api';
import { fetchTicketSummary } from './tickets.api';

const reply = {
  id: 'r-1',
  title: 'Đã nhận',
  body: 'Chào {tên}',
  order: 0,
  createdAt: '2026-10-09T01:00:00Z',
  updatedAt: '2026-10-09T01:00:00Z',
};

describe('ticket canned replies api', () => {
  it('reads the one page of replies', async () => {
    const calls = mockApi({ 'GET /ticket-canned-replies': page([reply], { pageSize: 100 }) });
    expect((await fetchCannedReplies()).items).toEqual([reply]);
    expect(calls[0]!.query.get('page')).toBe('1');
  });

  it('creates with the body as given', async () => {
    const calls = mockApi({ 'POST /ticket-canned-replies': ok(reply) });
    await createCannedReply({ title: 'Đã nhận', body: 'Chào {tên}' });
    expect(calls[0]!.body).toEqual({ title: 'Đã nhận', body: 'Chào {tên}' });
  });

  it('patches and deletes by id', async () => {
    const calls = mockApi({
      'PATCH /ticket-canned-replies/r-1': ok({ ...reply, order: 3 }),
      'DELETE /ticket-canned-replies/r-1': noContent(),
    });
    expect((await updateCannedReply('r-1', { order: 3 })).order).toBe(3);
    await expect(deleteCannedReply('r-1')).resolves.toBeUndefined();
    expect(calls.map((call) => `${call.method} ${call.path}`)).toEqual([
      'PATCH /ticket-canned-replies/r-1',
      'DELETE /ticket-canned-replies/r-1',
    ]);
    expect(calls[0]!.body).toEqual({ order: 3 });
  });

  it('reads the ticket summary past the HTTP cache', async () => {
    mockApi({ 'GET /tickets/summary': ok({ assignedOpen: 2, awaitingStaff: 5 }) });
    expect(await fetchTicketSummary()).toEqual({ assignedOpen: 2, awaitingStaff: 5 });
    expect(vi.mocked(fetch).mock.calls[0]![1]!.cache).toBe('no-cache');
  });
});
