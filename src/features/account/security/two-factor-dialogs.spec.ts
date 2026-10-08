import { flushPromises } from '@vue/test-utils';
import type { VueWrapper } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { useSessionStore } from '@/stores/session.store';
import { settingsRoutes } from '@/test/account-routes';
import { sessionUser, signedIn } from '@/test/fixtures';
import { fail, mockApi, noContent, ok, sequence } from '@/test/mock-api';
import type { MockHandler } from '@/test/mock-api';
import { mountApp } from '@/test/mount';

const CODES = [
  'K7QM2XRA9PTD4WLE',
  'H3ZN8CVB5YJF1MSU',
  'R6DT0GKE7NAQ3HXP',
  'W9LB4UFC2ZOV8TJY',
  'M1EY5SIP6RQG0DNK',
];
const totpOn = signedIn({ user: sessionUser({ isTotpEnabled: true }) });
const pageButton = (wrapper: VueWrapper, text: string) =>
  wrapper.findAll('#main button').find((button) => button.text() === text)!;
const inDialog = <Found extends Element>(selector: string) =>
  document.body.querySelector<Found>(`[role="dialog"] ${selector}`);
const dialogButton = (text: string) =>
  [...document.body.querySelectorAll<HTMLButtonElement>('[role="dialog"] button')].find(
    (button) => button.textContent?.trim() === text,
  )!;
const typeInto = (input: HTMLInputElement, value: string) => {
  input.value = value;
  input.dispatchEvent(new Event('input'));
};

async function openSecurity(routes: Record<string, MockHandler>) {
  const calls = mockApi({ ...settingsRoutes(), 'GET /auth/me': totpOn, ...routes });
  const { wrapper } = await mountApp('/settings/security');
  return { wrapper, calls };
}
async function openDisableDialog(wrapper: VueWrapper) {
  await pageButton(wrapper, 'Tắt').trigger('click');
  await flushPromises();
}
const sent = (calls: { method: string; path: string; body: unknown }[], path: string) =>
  calls.filter((call) => call.method === 'POST' && call.path === path).map((call) => call.body);

describe('Settings › Security › turning the app off', () => {
  it('asks for a code, sends it, closes and shows the app as off', async () => {
    const { wrapper, calls } = await openSecurity({
      'GET /auth/me': sequence(totpOn, signedIn()),
      'POST /auth/2fa/totp/disable': noContent(),
    });
    await openDisableDialog(wrapper);
    expect(dialogButton('Tắt xác thực').getAttribute('aria-disabled')).toBe('true');
    typeInto(inDialog<HTMLInputElement>('[role="group"] input')!, '123456');
    await flushPromises();
    dialogButton('Tắt xác thực').click();
    await flushPromises();
    expect(sent(calls, '/auth/2fa/totp/disable')).toEqual([{ code: '123456' }]);
    await vi.waitFor(() => expect(document.body.querySelector('[role="dialog"]')).toBeNull());
    expect(wrapper.get('#main [role="status"]').text()).toBe(
      'Đã tắt ứng dụng xác thực. Các mã dự phòng cũ đã bị xoá.',
    );
    expect(pageButton(wrapper, 'Bật')).toBeDefined();
  });

  it('accepts a backup code as printed: dashes, spaces and lower case', async () => {
    const { wrapper, calls } = await openSecurity({ 'POST /auth/2fa/totp/disable': noContent() });
    await openDisableDialog(wrapper);
    dialogButton('Hoặc nhập một mã dự phòng').click();
    await flushPromises();
    typeInto(inDialog<HTMLInputElement>('input[name="backupCode"]')!, 'k7qm-2xra 9ptd-4wle');
    await flushPromises();
    dialogButton('Tắt xác thực').click();
    await flushPromises();
    expect(sent(calls, '/auth/2fa/totp/disable')).toEqual([{ code: 'K7QM2XRA9PTD4WLE' }]);
  });

  it('keeps the dialog open with the reason after a wrong code', async () => {
    const { wrapper } = await openSecurity({
      'POST /auth/2fa/totp/disable': fail(400, 'invalid_code'),
    });
    await openDisableDialog(wrapper);
    typeInto(inDialog<HTMLInputElement>('[role="group"] input')!, '000000');
    await flushPromises();
    dialogButton('Tắt xác thực').click();
    await flushPromises();
    expect(inDialog('[role="alert"]')!.textContent).toContain('Mã sai hoặc đã hết hạn.');
  });
});

describe('Settings › Security › regenerating backup codes', () => {
  it('confirms, asks for a code, then shows the five new codes once', async () => {
    const { wrapper, calls } = await openSecurity({
      'POST /auth/2fa/totp/scratch-codes': ok({ scratchCodes: CODES }),
    });
    await pageButton(wrapper, 'Tạo lại mã dự phòng').trigger('click');
    await flushPromises();
    dialogButton('Tiếp tục').click();
    await flushPromises();
    await wrapper.get('[role="group"][aria-label="Mã xác thực"] input').setValue('123456');
    await wrapper.get('form[data-step="regenerate"]').trigger('submit');
    await flushPromises();
    expect(sent(calls, '/auth/2fa/totp/scratch-codes')).toEqual([{ code: '123456' }]);
    expect(wrapper.text()).toContain('Đã tạo năm mã dự phòng mới.');
    expect(wrapper.text()).toContain('K7QM-2XRA-9PTD-4WLE');
  });
});

describe('Settings › Security › remaining backup codes', () => {
  it.each([
    [5, 'Còn 5 mã dự phòng.'],
    [1, 'Còn 1 mã dự phòng: hãy tạo lại trước khi hết.'],
    [0, 'Đã hết mã dự phòng: hãy tạo lại ngay.'],
  ])('with %i left it says "%s"', async (remaining, text) => {
    const { wrapper } = await openSecurity({
      'GET /auth/2fa/totp/scratch-codes': ok({ remaining }),
    });
    expect(wrapper.text()).toContain(text);
  });

  it('asks again after regenerating', async () => {
    const { wrapper, calls } = await openSecurity({
      'GET /auth/2fa/totp/scratch-codes': sequence(ok({ remaining: 1 }), ok({ remaining: 5 })),
      'POST /auth/2fa/totp/scratch-codes': ok({ scratchCodes: CODES }),
    });
    await pageButton(wrapper, 'Tạo lại mã dự phòng').trigger('click');
    await flushPromises();
    dialogButton('Tiếp tục').click();
    await flushPromises();
    await wrapper.get('[role="group"][aria-label="Mã xác thực"] input').setValue('123456');
    await wrapper.get('form[data-step="regenerate"]').trigger('submit');
    await flushPromises();
    expect(
      calls.filter((call) => call.method === 'GET' && call.path === '/auth/2fa/totp/scratch-codes'),
    ).toHaveLength(2);
    expect(wrapper.text()).toContain('Còn 5 mã dự phòng.');
  });
});

const RATE_LIMITED = {
  status: 429,
  body: { error: { code: 'rate_limited', message: 'rate_limited' } },
  headers: { 'Retry-After': '42' },
};
const typeCodeAndConfirm = async (code: string) => {
  typeInto(inDialog<HTMLInputElement>('[role="group"] input')!, code);
  await flushPromises();
  dialogButton('Tắt xác thực').click();
  await flushPromises();
};

describe('Settings › Security › rate-limited code checks', () => {
  it('shows how long to wait when turning off is rate-limited, and keeps the dialog open', async () => {
    const { wrapper } = await openSecurity({ 'POST /auth/2fa/totp/disable': RATE_LIMITED });
    await openDisableDialog(wrapper);
    await typeCodeAndConfirm('123456');
    expect(inDialog('[role="alert"]')!.textContent).toContain('Thử lại sau 42 giây');
    expect(document.body.querySelector('[role="dialog"]')).not.toBeNull();
  });

  it('shows how long to wait when regenerating is rate-limited, and stays on the code step', async () => {
    const { wrapper } = await openSecurity({ 'POST /auth/2fa/totp/scratch-codes': RATE_LIMITED });
    await pageButton(wrapper, 'Tạo lại mã dự phòng').trigger('click');
    await flushPromises();
    dialogButton('Tiếp tục').click();
    await flushPromises();
    await wrapper.get('[role="group"][aria-label="Mã xác thực"] input').setValue('123456');
    await wrapper.get('form[data-step="regenerate"]').trigger('submit');
    await flushPromises();
    expect(wrapper.get('#main [role="alert"]').text()).toContain('Thử lại sau 42 giây');
    expect(wrapper.find('form[data-step="regenerate"]').exists()).toBe(true);
  });
});

describe('Settings › Security › regenerate Cancel while the request is in flight', () => {
  it('keeps Cancel inert until the new codes arrive, then shows them', async () => {
    const { wrapper } = await openSecurity({
      'POST /auth/2fa/totp/scratch-codes': ok({ scratchCodes: CODES }),
    });
    let release!: () => void;
    const gate = new Promise<void>((resolve) => (release = resolve));
    const answer = globalThis.fetch;
    vi.stubGlobal('fetch', async (input: string, init?: RequestInit) => {
      if (init?.method === 'POST' && String(input).includes('/auth/2fa/totp/scratch-codes'))
        await gate;
      return answer(input, init);
    });
    await pageButton(wrapper, 'Tạo lại mã dự phòng').trigger('click');
    await flushPromises();
    dialogButton('Tiếp tục').click();
    await flushPromises();
    await wrapper.get('[role="group"][aria-label="Mã xác thực"] input').setValue('123456');
    await wrapper.get('form[data-step="regenerate"]').trigger('submit');
    await flushPromises();
    const cancel = wrapper.findAll('#main button').find((button) => button.text() === 'Hủy')!;
    await cancel.trigger('click');
    await flushPromises();
    expect(wrapper.find('form[data-step="regenerate"]').exists()).toBe(true);
    release();
    await flushPromises();
    expect(wrapper.text()).toContain('K7QM-2XRA-9PTD-4WLE');
  });
});

describe('Settings › Security › the count after turning the app back on', () => {
  it('asks for the count again after the app was turned off and on', async () => {
    const { wrapper, calls } = await openSecurity({
      'GET /auth/me': sequence(totpOn, signedIn(), totpOn),
      'GET /auth/2fa/totp/scratch-codes': sequence(ok({ remaining: 1 }), ok({ remaining: 5 })),
      'POST /auth/2fa/totp/disable': noContent(),
    });
    expect(wrapper.text()).toContain('Còn 1 mã dự phòng: hãy tạo lại trước khi hết.');
    await openDisableDialog(wrapper);
    await typeCodeAndConfirm('123456');
    await vi.waitFor(() => expect(document.body.querySelector('[role="dialog"]')).toBeNull());
    await useSessionStore().refresh();
    await flushPromises();
    expect(wrapper.text()).toContain('Còn 5 mã dự phòng.');
    expect(
      calls.filter((call) => call.method === 'GET' && call.path === '/auth/2fa/totp/scratch-codes'),
    ).toHaveLength(2);
  });
});

describe('Settings › Security › backup-code entry details', () => {
  it('accepts a backup code copied with en dashes and zero-width spaces', async () => {
    const { wrapper, calls } = await openSecurity({ 'POST /auth/2fa/totp/disable': noContent() });
    await openDisableDialog(wrapper);
    dialogButton('Hoặc nhập một mã dự phòng').click();
    await flushPromises();
    typeInto(inDialog<HTMLInputElement>('input[name="backupCode"]')!, 'k7qm–2xra​9ptd–4wle');
    await flushPromises();
    dialogButton('Tắt xác thực').click();
    await flushPromises();
    expect(sent(calls, '/auth/2fa/totp/disable')).toEqual([{ code: 'K7QM2XRA9PTD4WLE' }]);
  });

  it('moves focus into the backup-code field when it is opened', async () => {
    const { wrapper } = await openSecurity({});
    await openDisableDialog(wrapper);
    dialogButton('Hoặc nhập một mã dự phòng').click();
    await flushPromises();
    expect(document.activeElement).toBe(inDialog('input[name="backupCode"]'));
  });
});
