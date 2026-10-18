import { flushPromises } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { ticketDetail } from '@/test/community-fixtures';
import { fail, mockApi, ok, sequence } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { signedInViewer } from '@/test/problem-routes';

describe('ticket patch conflict', () => {
  it('reloads the ticket and says it changed when the server answers 409 conflict', async () => {
    const stale = ticketDetail({
      can: { editNotes: false, markGood: true, assign: false, claim: false },
    });
    const fresh = { ...stale, isContributive: true };
    const calls = mockApi({
      ...signedInViewer(),
      [`GET /tickets/${stale.id}`]: sequence(ok(stale), ok(fresh)),
      [`PATCH /tickets/${stale.id}`]: fail(409, 'conflict'),
    });
    const { wrapper } = await mountApp(`/tickets/${stale.id}`);
    await wrapper.get('[data-testid="mark-good"]').trigger('click');
    await flushPromises();
    expect(
      calls.filter((call) => call.method === 'GET' && call.path === `/tickets/${stale.id}`),
    ).toHaveLength(2);
    expect(wrapper.findAll('[role="alert"]').map((alert) => alert.text())).toContain(
      'Phiếu đã thay đổi sau khi trang được tải. Phiếu đã được tải lại; hãy xem nội dung mới nhất rồi thử lại.',
    );
    expect(wrapper.get('[data-testid="mark-good"]').attributes('aria-pressed')).toBe('true');
  });
});
