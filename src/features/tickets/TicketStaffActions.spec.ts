import { flushPromises } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { ticketDetail } from '@/test/community-fixtures';
import { mockApi, ok } from '@/test/mock-api';
import { signedInViewer } from '@/test/problem-routes';
import { mountComponent } from '@/test/mount';
import TicketStaffActions from './TicketStaffActions.vue';

const ASSIGNER = { editNotes: false, markGood: false, assign: true, claim: false };
const LIMIT = 20;
const usernames = (count: number) => Array.from({ length: count }, (_row, index) => `user${index}`);

/** Mounts the staff card for a viewer who may assign, and returns the PATCH bodies sent. */
async function assignWith(text: string) {
  const detail = ticketDetail({ can: ASSIGNER });
  const calls = mockApi({ ...signedInViewer(), [`PATCH /tickets/${detail.id}`]: ok(detail) });
  const wrapper = mountComponent(TicketStaffActions, { props: { ticket: detail } });
  await wrapper.get('input[name="assignees"]').setValue(text);
  await wrapper.get('form[data-testid="assignees-form"]').trigger('submit');
  await flushPromises();
  return { wrapper, patches: calls.filter((call) => call.method === 'PATCH') };
}

describe('staff card: assignee list', () => {
  it('sends each name once, in the order typed', async () => {
    const { patches } = await assignWith('colan, colan  thayhung colan');
    expect(patches.map((call) => call.body)).toEqual([{ assignees: ['colan', 'thayhung'] }]);
  });
  it('sends nothing and says so when there are more than 20 names', async () => {
    const { wrapper, patches } = await assignWith(usernames(LIMIT + 1).join(', '));
    expect(patches).toEqual([]);
    expect(wrapper.get('[role="alert"]').text()).toBe('Tối đa 20 người xử lý.');
    expect(
      wrapper
        .get('form[data-testid="assignees-form"] button[type="submit"]')
        .attributes('aria-disabled'),
    ).toBe('true');
  });
});
