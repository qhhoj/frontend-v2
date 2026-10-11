import { flushPromises } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { joinRequest, organizationDetail } from '@/test/community-fixtures';
import { organizationRoutes } from '@/test/community-routes';
import { fail, mockApi, ok, page } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { signedInViewer } from '@/test/problem-routes';

const admin = organizationDetail({
  slug: 'hcmus',
  viewer: { isMember: true, canAdminister: true, pendingRequestId: null },
});

describe('join requests', () => {
  it('approves a pending request and refreshes the queue', async () => {
    const calls = mockApi({
      ...signedInViewer(),
      ...organizationRoutes(admin),
      'GET /organizations/hcmus/requests': page([joinRequest()], { total: 1 }),
      [`POST /organizations/hcmus/requests/${joinRequest().id}/decide`]: ok(
        joinRequest({ state: 'A' }),
      ),
    });
    const { wrapper } = await mountApp('/organizations/hcmus/requests');
    await wrapper.get('button[data-testid="approve"]').trigger('click');
    await flushPromises();
    expect(calls.find((call) => call.path.endsWith('/decide'))!.body).toEqual({ state: 'A' });
    expect(calls.filter((call) => call.path === '/organizations/hcmus/requests')).toHaveLength(2);
  });
});

describe('join requests: queue', () => {
  it('shows a non-administrator the forbidden state instead of a request', async () => {
    const calls = mockApi({ ...signedInViewer(), ...organizationRoutes() });
    const { wrapper } = await mountApp('/organizations/lhp/requests');
    expect(wrapper.find('[data-state="forbidden"]').exists()).toBe(true);
    expect(calls.some((call) => call.path.endsWith('/requests'))).toBe(false);
  });
});

describe('join requests: refused decisions', () => {
  it('reloads the queue after a refused approval and names both causes', async () => {
    const calls = mockApi({
      ...signedInViewer(),
      ...organizationRoutes(admin),
      'GET /organizations/hcmus/requests': page([joinRequest()]),
      [`POST /organizations/hcmus/requests/${joinRequest().id}/decide`]: fail(409, 'conflict'),
    });
    const { wrapper } = await mountApp('/organizations/hcmus/requests');
    await wrapper.get('button[data-testid="approve"]').trigger('click');
    await flushPromises();
    expect(wrapper.get('[data-state="error"]').text()).toContain('đã hết chỗ');
    expect(wrapper.get('[data-state="error"]').text()).toContain('đã được xử lý trước đó');
    expect(calls.filter((call) => call.path === '/organizations/hcmus/requests')).toHaveLength(2);
  });
});
