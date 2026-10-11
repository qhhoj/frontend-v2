import { describe, expect, it } from 'vitest';
import { mockApi, ok, page } from '@/test/mock-api';
import type { MockHandler } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { signedInViewer } from '@/test/problem-routes';
import { sessionUser } from '@/test/fixtures';

const handlerViewer = () =>
  signedInViewer({ user: sessionUser({ isStaff: true, permissions: ['judge.change_ticket'] }) });
async function ticketsWith(
  viewer: Record<string, MockHandler>,
  assignedOpen: number,
  awaitingStaff: number,
) {
  const calls = mockApi({
    ...viewer,
    'GET /tickets': page([]),
    'GET /tickets/summary': ok({ assignedOpen, awaitingStaff }),
  });
  const { wrapper } = await mountApp('/tickets');
  return { strip: wrapper.find('[data-testid="ticket-alerts"]'), calls };
}

describe('ticket alerts strip', () => {
  it('never shows a member the staff count, even if one arrives', async () => {
    const { strip } = await ticketsWith(signedInViewer(), 1, 9);
    expect(strip.text()).not.toContain('chờ nhân viên');
  });

  it('shows a handler the tickets waiting for staff, linked to the queue', async () => {
    const { strip } = await ticketsWith(handlerViewer(), 0, 5);
    const link = strip.get('a');
    expect(link.text()).toBe('5 phiếu đang chờ nhân viên trả lời');
    expect(link.attributes('href')).toBe('/admin/tickets?scope=all&open=1');
  });
});
