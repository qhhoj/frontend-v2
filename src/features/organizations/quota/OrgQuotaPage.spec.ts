import { describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { mockApi } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { signedInViewer } from '@/test/problem-routes';
import { MIB, organizationUsage, quotaMeter } from '@/test/f4-fixtures';
import { MEMBER_STATE, orgUsageRoutes } from '@/test/f4-routes';

const TAB = '/organizations/lhp/quota';
async function mountTab() {
  const mounted = await mountApp(TAB);
  await flushPromises();
  await vi.waitFor(() => {
    expect(mounted.wrapper.find('[data-testid="org-quota"]').exists()).toBe(true);
    expect(mounted.wrapper.find('[data-skeleton-region="quota-meters"]').exists()).toBe(false);
  });
  await flushPromises();
  return mounted;
}

describe('OrgQuotaPage', () => {
  it('shows both meters with numbers, percentages and the warn-mode warning at 82 %', async () => {
    mockApi({ ...signedInViewer(), ...orgUsageRoutes() });
    const { wrapper } = await mountTab();
    const text = wrapper.text();
    expect(text).toContain('164 / 200 tín dụng');
    expect(text).toContain('410 MiB / 512 MiB');
    expect(text).toContain('Còn 102 MiB');
    expect(
      wrapper.findAll('[role="progressbar"]').map((bar) => bar.attributes('aria-valuenow')),
    ).toEqual(['82', '80']);
    const notice = wrapper.get('[data-testid="quota-notice"]');
    expect(notice.text()).toContain('82%');
    expect(notice.text()).toContain('chế độ cảnh báo');
    expect(notice.find('[data-testid="inline-bit"]').exists()).toBe(true);
  });

  it('shows Không giới hạn with no bars, percentages or blocking for an unlimited organization', async () => {
    mockApi({
      ...signedInViewer(),
      ...orgUsageRoutes(
        organizationUsage({
          unlimited: true,
          enforcing: true,
          credits: { used: 900, limit: 200, isOver: false, isNearLimit: false },
        }),
      ),
    });
    const { wrapper } = await mountTab();
    const text = wrapper.text();
    expect(text).toContain('900 / Không giới hạn tín dụng');
    expect(wrapper.findAll('[role="progressbar"]')).toHaveLength(0);
    expect(wrapper.get('[data-testid="quota-notice"]').text()).toContain('Không giới hạn');
    expect(wrapper.find('[role="alert"]').exists()).toBe(false);
  });

  it('says every quota has room below 80 %', async () => {
    mockApi({
      ...signedInViewer(),
      ...orgUsageRoutes(
        organizationUsage({
          credits: quotaMeter(20, 200),
          storage: quotaMeter(10 * MIB, 512 * MIB),
        }),
      ),
    });
    const { wrapper } = await mountTab();
    expect(wrapper.get('[data-testid="quota-notice"]').text()).toContain('Hạn mức còn dư');
  });

  it('says creation is blocked in enforce mode once a meter is over', async () => {
    mockApi({
      ...signedInViewer(),
      ...orgUsageRoutes(
        organizationUsage({
          enforcing: true,
          credits: quotaMeter(201, 200),
          storage: quotaMeter(0, MIB),
        }),
      ),
    });
    const { wrapper } = await mountTab();
    const notice = wrapper.get('[data-testid="quota-notice"]');
    expect(notice.text()).toContain('Chế độ chặn đang bật');
    expect(notice.attributes('role')).toBe('alert');
  });

  it('lists the ledger with spends as minus and refunds as plus', async () => {
    mockApi({ ...signedInViewer(), ...orgUsageRoutes() });
    const { wrapper } = await mountTab();
    const ledger = wrapper.get('[data-testid="credit-ledger"]');
    expect(ledger.text()).toContain('−10');
    expect(ledger.text()).toContain('+10');
    expect(ledger.text()).toContain('Hoàn tín dụng');
    const bodyRows = ledger.findAll('tbody tr').map((row) => row.findAll('td').at(-1)!.text());
    expect(bodyRows).toEqual(['minhthu', 'minhthu', '—', 'minhthu']);
  });

  it('shows an empty ledger with the asleep Bit', async () => {
    mockApi({ ...signedInViewer(), ...orgUsageRoutes(organizationUsage({ recent: [] })) });
    const { wrapper } = await mountTab();
    expect(wrapper.get('[data-testid="credit-ledger"]').text()).toContain('Chưa có giao dịch');
  });

  it('refuses a member who is not an administrator without asking for usage', async () => {
    const calls = mockApi({ ...signedInViewer(), ...orgUsageRoutes(undefined, MEMBER_STATE) });
    const { wrapper } = await mountApp(TAB);
    await flushPromises();
    expect(wrapper.get('[data-testid="state-panel"]').attributes('data-state')).toBe('forbidden');
    expect(calls.some((call) => call.path === '/organizations/lhp/usage')).toBe(false);
  });
});
