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
  it('links a member to the open tickets assigned to them', async () => {
    const { strip } = await ticketsWith(signedInViewer(), 2, 0);
    const link = strip.get('a');
    expect(link.text()).toBe('2 phiếu đang mở giao cho bạn');
    expect(link.attributes('href')).toBe('/tickets?scope=all&open=1&assignee=user_01');
    expect(strip.text()).not.toContain('chờ nhân viên');
  });

  it('stays hidden for a member with nothing assigned', async () => {
    const { strip } = await ticketsWith(signedInViewer(), 0, 0);
    expect(strip.exists()).toBe(false);
  });

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

  it('tells a handler when nothing waits, with the crowned Bit', async () => {
    const { strip } = await ticketsWith(handlerViewer(), 0, 0);
    expect(strip.text()).toContain('Không có phiếu nào đang chờ bạn.');
    expect(strip.find('[data-testid="inline-bit"]').exists()).toBe(true);
  });

  it('asks the summary once per load, keyed by the viewer', async () => {
    const { calls } = await ticketsWith(signedInViewer(), 1, 0);
    expect(calls.filter((call) => call.path === '/tickets/summary')).toHaveLength(1);
  });
});
