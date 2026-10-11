import { flushPromises } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { translate } from '@/i18n';
import { STAFF_ID, staffViewer } from '@/test/admin-routes';
import { createdIntegrationClient, INTEGRATION_KEY, integrationClient } from '@/test/f5-fixtures';
import { profile, sessionUser, signedIn } from '@/test/fixtures';
import { invalid, issue, mockApi, ok, page } from '@/test/mock-api';
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
  await vi.waitFor(() => expect(mounted.wrapper.find('tr[data-client]').exists()).toBe(true));
  await flushPromises();
  return mounted;
};
type Wrapper = Awaited<ReturnType<typeof openPage>>['wrapper'];
const rowOf = (wrapper: Wrapper, name: string) =>
  wrapper.findAll('tr[data-client]').find((row) => row.text().includes(name))!;
/** The create form is in a drawer, rendered into `document.body`. */
const formOf = () => document.querySelector<HTMLFormElement>('[data-testid="integration-form"]');
const fill = (selector: string, value: string) => {
  const field = formOf()!.querySelector<HTMLInputElement>(selector)!;
  field.value = value;
  field.dispatchEvent(new Event('input'));
};
const openForm = async (wrapper: Wrapper) => {
  await wrapper.get('[data-testid="integration-create"]').trigger('click');
  await vi.waitFor(() => expect(formOf()).not.toBeNull());
};
const fillForm = async (wrapper: Wrapper) => {
  await openForm(wrapper);
  fill('#integration-name', 'Hệ thống thi tỉnh');
  for (const scope of ['contests:write', 'contests:read']) {
    formOf()!.querySelector<HTMLInputElement>(`input[value="${scope}"]`)!.click();
    await flushPromises();
  }
  fill('#integration-cidrs', '10.0.0.0/8\n192.168.1.0/24');
  fill('#integration-acts-as', 'syncauthor');
  await flushPromises();
  return formOf()!;
};
/** The reveal-once dialog (the drawer may still be leaving). */
const keyDialog = () =>
  [...document.querySelectorAll<HTMLElement>('[role="dialog"]')].find((dialog) =>
    dialog.querySelector('[data-testid="key-close"]'),
  )!;
const submit = async (form: HTMLFormElement) => {
  form.dispatchEvent(new Event('submit', { cancelable: true }));
  await flushPromises();
};

describe('IntegrationClientsPage', () => {
  it('creates a key, shows it once in a dialog that cannot close before "saved", and never in the table', async () => {
    const calls = mockApi(
      routes({
        'POST /integration-clients': { status: 201, ...ok(createdIntegrationClient()) },
      }),
    );
    const { wrapper } = await openPage();
    await submit(await fillForm(wrapper));
    await vi.waitFor(() => expect(keyDialog()).toBeDefined());
    expect(calls.find((call) => call.method === 'POST')!.body).toEqual({
      name: 'Hệ thống thi tỉnh',
      scopes: ['contests:write', 'contests:read'],
      allowedCidrs: ['10.0.0.0/8', '192.168.1.0/24'],
      actsAs: 'syncauthor',
    });
    expect(keyDialog().textContent).toContain(INTEGRATION_KEY);
    const close = keyDialog().querySelector<HTMLButtonElement>('[data-testid="key-close"]')!;
    expect(close.getAttribute('aria-disabled')).toBe('true');
    close.click();
    await flushPromises();
    expect(document.body.textContent).toContain(INTEGRATION_KEY);
    expect(wrapper.get('[data-testid="integration-table"]').text()).not.toContain(INTEGRATION_KEY);
    keyDialog().querySelector<HTMLInputElement>('#key-saved')!.click();
    await flushPromises();
    close.click();
    await vi.waitFor(() => expect(document.body.textContent).not.toContain(INTEGRATION_KEY));
    expect(
      calls.filter((call) => call.path === '/integration-clients' && call.method === 'GET'),
    ).toHaveLength(2);
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
    await submit(form);
    expect(form.querySelector('#integration-acts-as')!.getAttribute('aria-invalid')).toBe('true');
    expect(form.querySelector('#integration-cidrs')!.getAttribute('aria-invalid')).toBe('true');
    expect(form.textContent).toContain(translate('admin.integrations.form.actsAsRefused'));
    expect(form.textContent).toContain(translate('admin.integrations.form.cidrRefused'));
    expect(form.textContent).not.toContain('This user needs judge.create_private_contest.');
  });

  it('marks a key past its expiry as expired, not active, while a future one stays active', async () => {
    const lapsed = integrationClient({
      id: '0192a000-0000-7000-8000-0000000f0003',
      name: 'Khóa hết hạn',
      expiresAt: '2020-01-01T00:00:00.000Z',
    });
    const future = integrationClient({
      id: '0192a000-0000-7000-8000-0000000f0004',
      name: 'Khóa còn hạn',
      expiresAt: '2999-01-01T00:00:00.000Z',
    });
    mockApi(routes({ 'GET /integration-clients': page([lapsed, future]) }));
    const { wrapper } = await openPage();
    expect(rowOf(wrapper, 'Khóa hết hạn').text()).toContain('Đã hết hạn');
    expect(rowOf(wrapper, 'Khóa hết hạn').text()).not.toContain('Đang dùng');
    expect(rowOf(wrapper, 'Khóa còn hạn').text()).toContain('Đang dùng');
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
    const create = wrapper.get('[data-testid="integration-create"]');
    expect(create.attributes('aria-disabled')).toBe('true');
    await create.trigger('click');
    await flushPromises();
    expect(formOf()).toBeNull();
    expect(calls.some((call) => call.method === 'POST')).toBe(false);
    const revoke = rowOf(wrapper, 'Hệ thống thi tỉnh').get('button');
    expect(revoke.attributes('aria-disabled')).toBe('true');
    await revoke.trigger('click');
    await flushPromises();
    expect(document.body.querySelector('[role="dialog"]')).toBeNull();
  });
});
