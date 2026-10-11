import { describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { mockApi, ok, page, sequence } from '@/test/mock-api';
import type { ApiCall } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { confirmDialog, openDialog, staffViewer } from '@/test/admin-routes';
import { MIB, organizationUsage, usageRow } from '@/test/f4-fixtures';

const EDIT = ['judge.edit_all_organization'];
const OVERVIEW = '/organizations/usage';
type Wrapper = Awaited<ReturnType<typeof mountApp>>['wrapper'];
const overviewCalls = (calls: ApiCall[]) => calls.filter((call) => call.path === OVERVIEW);
async function mountOverview(path = '/admin/organizations/quotas') {
  const mounted = await mountApp(path);
  await vi.waitFor(
    () => {
      const section = mounted.wrapper.find('[data-testid="quota-overview"]');
      if (!section.exists() || section.find('[data-testid="query-skeleton"]').exists())
        throw new Error('not yet');
    },
    { timeout: 5000 },
  );
  await flushPromises();
  return mounted;
}
const buttonNamed = (wrapper: Wrapper, name: string) =>
  wrapper.findAll('button').find((button) => button.attributes('aria-label') === name)!;
async function fill(selector: string, value: string) {
  const input = openDialog().querySelector<HTMLInputElement>(selector)!;
  input.value = value;
  input.dispatchEvent(new Event('input'));
  await flushPromises();
}
const routes = () => ({
  ...staffViewer(EDIT),
  [`GET ${OVERVIEW}`]: page([usageRow(), usageRow({ slug: 'ntt', name: 'NTT', creditsUsed: 10 })]),
  'GET /organizations/lhp/usage': ok(
    organizationUsage({ quota: { monthlyCredits: 300, storageBytes: null } }),
  ),
});

describe('QuotaOverviewPage', () => {
  it('keeps typed values when the usage refetches under the open dialog', async () => {
    const quota = { monthlyCredits: 300, storageBytes: null };
    const calls = mockApi({
      ...routes(),
      'GET /organizations/lhp/usage': sequence(
        ok(organizationUsage({ quota })),
        ok(
          organizationUsage({
            quota,
            credits: { used: 180, limit: 300, isOver: false, isNearLimit: true },
          }),
        ),
      ),
    });
    const { wrapper, queryClient } = await mountOverview();
    await buttonNamed(wrapper, 'Sửa hạn mức THPT chuyên Lê Hồng Phong').trigger('click');
    await flushPromises();
    await fill('#quota-credits', '450');
    await queryClient.invalidateQueries({ queryKey: ['admin'] });
    await flushPromises();
    expect(calls.filter((call) => call.path === '/organizations/lhp/usage')).toHaveLength(2);
    expect(openDialog().querySelector<HTMLInputElement>('#quota-credits')!.value).toBe('450');
  });

  it('prefills the overrides and PATCHes only what changed', async () => {
    const calls = mockApi({
      ...routes(),
      'PATCH /organizations/lhp/quota': ok(organizationUsage()),
    });
    const { wrapper } = await mountOverview();
    await buttonNamed(wrapper, 'Sửa hạn mức THPT chuyên Lê Hồng Phong').trigger('click');
    await flushPromises();
    expect(openDialog().querySelector<HTMLInputElement>('#quota-credits')!.value).toBe('300');
    expect(openDialog().querySelector<HTMLInputElement>('#quota-storage')!.value).toBe('');
    await fill('#quota-credits', '');
    await fill('#quota-storage', '1024');
    await confirmDialog('Lưu hạn mức');
    expect(calls.find((call) => call.method === 'PATCH')!.body).toEqual({
      quotaMonthlyCredits: null,
      quotaStorageBytes: 1024 * MIB,
    });
    expect(wrapper.get('[role="status"]').text()).toContain(
      'Đã lưu hạn mức của THPT chuyên Lê Hồng Phong',
    );
    expect(overviewCalls(calls).length).toBeGreaterThan(1);
  });

  it('shows Không giới hạn instead of limits and percentages, and the toggle ends the promotion', async () => {
    const calls = mockApi({
      ...routes(),
      [`GET ${OVERVIEW}`]: page([usageRow({ unlimited: true, creditsLimit: 200 })]),
      'GET /organizations/lhp/usage': ok(organizationUsage({ unlimited: true })),
      'PATCH /organizations/lhp/quota': ok(organizationUsage()),
    });
    const { wrapper } = await mountOverview();
    expect(wrapper.text()).toContain('164 / Không giới hạn');
    expect(wrapper.text()).not.toContain('164 / 200');
    expect(wrapper.text()).not.toContain('82%');
    await buttonNamed(wrapper, 'Sửa hạn mức THPT chuyên Lê Hồng Phong').trigger('click');
    await flushPromises();
    const toggle = openDialog().querySelector<HTMLInputElement>('[data-testid="quota-unlimited"]')!;
    expect(toggle.checked).toBe(true);
    toggle.click();
    await flushPromises();
    await confirmDialog('Lưu hạn mức');
    expect(calls.find((call) => call.method === 'PATCH')!.body).toEqual({ quotaUnlimited: false });
  });
});
