import { describe, expect, it } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { mockApi } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { signedInViewer } from '@/test/problem-routes';
import { MEMBER_STATE, orgUsageRoutes } from '@/test/f4-routes';

const TAB = '/organizations/lhp/quota';
describe('OrgQuotaPage', () => {
  it('refuses a member who is not an administrator without asking for usage', async () => {
    const calls = mockApi({ ...signedInViewer(), ...orgUsageRoutes(undefined, MEMBER_STATE) });
    const { wrapper } = await mountApp(TAB);
    await flushPromises();
    expect(wrapper.get('[data-testid="state-panel"]').attributes('data-state')).toBe('forbidden');
    expect(calls.some((call) => call.path === '/organizations/lhp/usage')).toBe(false);
  });
});
