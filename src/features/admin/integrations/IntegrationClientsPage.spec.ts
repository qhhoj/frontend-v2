import { flushPromises } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { translate } from '@/i18n';
import { confirmDialog, openDialog, STAFF_ID, staffViewer } from '@/test/admin-routes';
import { createdIntegrationClient, INTEGRATION_KEY, integrationClient } from '@/test/f5-fixtures';
import { profile, sessionUser, signedIn } from '@/test/fixtures';
import { fail, invalid, issue, mockApi, noContent, ok, page, sequence } from '@/test/mock-api';
import type { MockHandler } from '@/test/mock-api';
import { mountApp } from '@/test/mount';

const PERMISSIONS = ['judge.manage_integration'];
const REVOKED = integrationClient({
  id: '0192a000-0000-7000-8000-0000000f0002',
  name: 'Cổng cũ',
  revokedAt: '2026-10-01T00:00:00.000Z',
});
const routes = (extra: Record<string, MockHandler> = {}) => ({
  ...staffViewer(PERMISSIONS),
  'GET /integration-clients': page([integrationClient(), REVOKED]),
  ...extra,
});
const openPage = async () => {
  const mounted = await mountApp('/admin/integrations');
  await vi.waitFor(() =>
    expect(mounted.wrapper.find('[data-testid="integration-form"]').exists()).toBe(true),
  );
  await flushPromises();
  return mounted;
};
type Wrapper = Awaited<ReturnType<typeof openPage>>['wrapper'];
const rowOf = (wrapper: Wrapper, name: string) =>
  wrapper.findAll('tr[data-client]').find((row) => row.text().includes(name))!;
const fillForm = async (wrapper: Wrapper) => {
  const form = wrapper.get('[data-testid="integration-form"]');
  await form.get('#integration-name').setValue('Hệ thống thi tỉnh');
  await form.get('input[value="contests:write"]').setValue(true);
  await form.get('input[value="contests:read"]').setValue(true);
  await form.get('#integration-cidrs').setValue('10.0.0.0/8\n192.168.1.0/24');
  await form.get('#integration-acts-as').setValue('syncauthor');
  return form;
};

describe('IntegrationClientsPage', () => {
  it('lists clients with key prefix, permissions and acting user; a revoked one has no revoke button', async () => {
    mockApi(routes());
    const { wrapper } = await openPage();
    const active = rowOf(wrapper, 'Hệ thống thi tỉnh');
    expect(active.text()).toContain('qhi_');
    expect(active.text()).toContain('syncauthor');
    expect(active.text()).toContain('contests:read');
    expect(active.find('button').exists()).toBe(true);
    expect(rowOf(wrapper, 'Cổng cũ').text()).toContain('Đã thu hồi');
    expect(rowOf(wrapper, 'Cổng cũ').find('button').exists()).toBe(false);
  });

  it('creates a key, shows it once in a dialog that cannot close before "saved", and never in the table', async () => {
    const calls = mockApi(
      routes({
        'POST /integration-clients': { status: 201, ...ok(createdIntegrationClient()) },
      }),
    );
    const { wrapper } = await openPage();
    const form = await fillForm(wrapper);
    await form.trigger('submit');
    await flushPromises();
    expect(calls.find((call) => call.method === 'POST')!.body).toEqual({
      name: 'Hệ thống thi tỉnh',
      scopes: ['contests:write', 'contests:read'],
      allowedCidrs: ['10.0.0.0/8', '192.168.1.0/24'],
      actsAs: 'syncauthor',
    });
    expect(openDialog().textContent).toContain(INTEGRATION_KEY);
    const close = openDialog().querySelector<HTMLButtonElement>('[data-testid="key-close"]')!;
    expect(close.getAttribute('aria-disabled')).toBe('true');
    close.click();
    await flushPromises();
    expect(document.body.textContent).toContain(INTEGRATION_KEY);
    expect(wrapper.get('[data-testid="integration-table"]').text()).not.toContain(INTEGRATION_KEY);
    openDialog().querySelector<HTMLInputElement>('#key-saved')!.click();
    await flushPromises();
    close.click();
    await new Promise((resolve) => setTimeout(resolve, 400));
    expect(document.body.textContent).not.toContain(INTEGRATION_KEY);
    expect(
      calls.filter((call) => call.path === '/integration-clients' && call.method === 'GET'),
    ).toHaveLength(2);
  });

  it('sends the chosen expiry', async () => {
    const calls = mockApi(
      routes({ 'POST /integration-clients': { status: 201, ...ok(createdIntegrationClient()) } }),
    );
    const { wrapper } = await openPage();
    const form = await fillForm(wrapper);
    await form.get('#integration-expires').setValue('2099-01-02T03:04');
    await form.trigger('submit');
    await flushPromises();
    const body = calls.find((call) => call.method === 'POST')!.body as { expiresAt: string };
    expect(new Date(body.expiresAt).getTime()).toBe(new Date('2099-01-02T03:04').getTime());
  });

  it('puts a refused acting user and a bad CIDR on their fields', async () => {
    mockApi(
      routes({
        'POST /integration-clients': invalid(
          issue('actsAs', 'invalid', 'This user needs judge.create_private_contest.'),
          issue('allowedCidrs', 'invalid', 'Not a CIDR block: 10.0.0.0'),
        ),
      }),
    );
    const { wrapper } = await openPage();
    const form = await fillForm(wrapper);
    await form.trigger('submit');
    await flushPromises();
    expect(form.get('#integration-acts-as').attributes('aria-invalid')).toBe('true');
    expect(form.get('#integration-cidrs').attributes('aria-invalid')).toBe('true');
    expect(form.text()).toContain(translate('admin.integrations.form.actsAsRefused'));
    expect(form.text()).toContain(translate('admin.integrations.form.cidrRefused'));
    expect(form.text()).not.toContain('This user needs judge.create_private_contest.');
  });

  it('shows a refusal line for a 403 (user API token, impersonation)', async () => {
    mockApi(routes({ 'POST /integration-clients': fail(403, 'forbidden') }));
    const { wrapper } = await openPage();
    const form = await fillForm(wrapper);
    await form.trigger('submit');
    await flushPromises();
    expect(wrapper.get('[role="alert"]').text()).toContain(translate('errors.forbidden'));
  });

  it('refuses to mint or revoke while impersonating, and sends nothing', async () => {
    const calls = mockApi({
      'GET /auth/me': signedIn({
        user: sessionUser({
          id: STAFF_ID,
          username: 'minhthu',
          isStaff: true,
          permissions: PERMISSIONS,
        }),
        impersonatorId: '0192a000-0000-7000-8000-00000000a0ff',
      }),
      'GET /profile': ok(profile()),
      'GET /integration-clients': page([integrationClient()]),
    });
    const { wrapper } = await openPage();
    expect(wrapper.text()).toContain('Bạn đang xem dưới tên người khác');
    const form = wrapper.get('[data-testid="integration-form"]');
    expect(form.get('button[type="submit"]').attributes('aria-disabled')).toBe('true');
    await form.trigger('submit');
    await flushPromises();
    expect(calls.some((call) => call.method === 'POST')).toBe(false);
    const revoke = rowOf(wrapper, 'Hệ thống thi tỉnh').get('button');
    expect(revoke.attributes('aria-disabled')).toBe('true');
    await revoke.trigger('click');
    await flushPromises();
    expect(document.body.querySelector('[role="dialog"]')).toBeNull();
  });

  it('revokes only after confirming', async () => {
    const { id } = integrationClient();
    const calls = mockApi(
      routes({
        'GET /integration-clients': sequence(
          page([integrationClient()]),
          page([integrationClient({ revokedAt: '2026-10-09T09:00:00.000Z' })]),
        ),
        [`DELETE /integration-clients/${id}`]: noContent(),
      }),
    );
    const { wrapper } = await openPage();
    await rowOf(wrapper, 'Hệ thống thi tỉnh').get('button').trigger('click');
    await flushPromises();
    expect(calls.some((call) => call.method === 'DELETE')).toBe(false);
    await confirmDialog('Thu hồi khoá');
    await flushPromises();
    expect(
      calls.some((call) => call.method === 'DELETE' && call.path === `/integration-clients/${id}`),
    ).toBe(true);
    expect(rowOf(wrapper, 'Hệ thống thi tỉnh').text()).toContain('Đã thu hồi');
  });
});
