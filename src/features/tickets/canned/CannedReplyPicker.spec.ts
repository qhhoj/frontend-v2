import { flushPromises } from '@vue/test-utils';
import type { VueWrapper } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import type { TicketDetail } from '@/api/types/tickets';
import { cannedReply, ticketDetail } from '@/test/community-fixtures';
import { fail, mockApi, ok, page } from '@/test/mock-api';
import type { ApiCall, MockHandler } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { signedInViewer } from '@/test/problem-routes';

const STAFF_TICKET = ticketDetail({ can: { editNotes: true, markGood: true, assign: true } });
async function openTicket(detail: TicketDetail, replies: MockHandler) {
  const calls = mockApi({
    ...signedInViewer(),
    [`GET /tickets/${detail.id}`]: ok(detail),
    'GET /ticket-canned-replies': replies,
  });
  const { wrapper } = await mountApp(`/tickets/${detail.id}`);
  return { wrapper, calls };
}
const cannedCalls = (calls: ApiCall[]) =>
  calls.filter((call) => call.path === '/ticket-canned-replies');
async function openPicker(wrapper: VueWrapper) {
  await wrapper.get('[data-testid="canned-picker"]').trigger('click');
  await flushPromises();
}
const pickerPanel = () => document.body.querySelector<HTMLElement>('[role="dialog"]');

describe('canned reply picker', () => {
  it('reads the replies only when opened and inserts the chosen one, filled in, into the draft', async () => {
    const { wrapper, calls } = await openTicket(
      STAFF_TICKET,
      page([cannedReply()], { pageSize: 100 }),
    );
    expect(cannedCalls(calls)).toHaveLength(0);
    const textarea = wrapper.get<HTMLTextAreaElement>('[data-testid="ticket-reply"] textarea');
    await textarea.setValue('Đã xem.');
    await openPicker(wrapper);
    expect(cannedCalls(calls)).toHaveLength(1);
    [...pickerPanel()!.querySelectorAll('button')]
      .find((button) => button.textContent?.includes('Đã nhận phiếu'))!
      .click();
    await flushPromises();
    expect(textarea.element.value).toBe(
      'Đã xem.\n\nChào user_01, cảm ơn bạn đã báo lỗi ở bài Trò chơi trên cây. Mình đang kiểm tra lại.',
    );
    expect(document.activeElement).toBe(textarea.element);
    expect(wrapper.get('[data-testid="canned-inserted"]').text()).toBe(
      'Đã chèn mẫu “Đã nhận phiếu”.',
    );
  });

  it('shows the quill Bit and the link to manage them when there is none', async () => {
    const { wrapper } = await openTicket(STAFF_TICKET, page([], { pageSize: 100 }));
    await openPicker(wrapper);
    expect(pickerPanel()!.textContent).toContain('Chưa có mẫu trả lời nào.');
    expect(pickerPanel()!.querySelector('a[href="/admin/tickets/canned"]')).not.toBeNull();
    expect(pickerPanel()!.querySelector('[data-testid="inline-bit"]')).not.toBeNull();
  });

  it('shows the load error with a retry', async () => {
    const { wrapper } = await openTicket(STAFF_TICKET, fail(503, 'network_error'));
    await openPicker(wrapper);
    expect(pickerPanel()!.textContent).toContain('Không kết nối được máy chủ.');
  });

  it('is not offered to the ticket owner, who asks for nothing', async () => {
    const { wrapper, calls } = await openTicket(ticketDetail(), page([cannedReply()]));
    expect(wrapper.find('[data-testid="canned-picker"]').exists()).toBe(false);
    expect(cannedCalls(calls)).toHaveLength(0);
  });
});
