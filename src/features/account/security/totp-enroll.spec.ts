import { flushPromises } from '@vue/test-utils';
import type { VueWrapper } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { settingsRoutes } from '@/test/account-routes';
import { sessionUser, signedIn } from '@/test/fixtures';
import { fail, issue, mockApi, ok, sequence } from '@/test/mock-api';
import type { MockHandler } from '@/test/mock-api';
import { mountApp } from '@/test/mount';

const ENROLLMENT = {
  secret: 'JBSWY3DPEHPK3PXP',
  otpauthUrl: 'otpauth://totp/QHHOJ:user_01?secret=JBSWY3DPEHPK3PXP&issuer=QHHOJ',
};
const CODES = [
  'K7QM2XRA9PTD4WLE',
  'H3ZN8CVB5YJF1MSU',
  'R6DT0GKE7NAQ3HXP',
  'W9LB4UFC2ZOV8TJY',
  'M1EY5SIP6RQG0DNK',
];
const button = (wrapper: VueWrapper, text: string) =>
  wrapper.findAll('#main button').find((candidate) => candidate.text() === text)!;
const dialog = () => document.body.querySelector<HTMLElement>('[role="dialog"]')!;
const dialogButton = (text: string) =>
  [...dialog().querySelectorAll<HTMLButtonElement>('button')].find(
    (candidate) => candidate.textContent?.trim() === text,
  )!;
const codeBoxes = (wrapper: VueWrapper) =>
  wrapper.findAll('[role="group"][aria-label="Mã xác nhận"] input');

async function startEnrolment(routes: Record<string, MockHandler> = {}) {
  const calls = mockApi({
    ...settingsRoutes(),
    'GET /auth/me': sequence(signedIn(), signedIn({ user: sessionUser({ isTotpEnabled: true }) })),
    'POST /auth/2fa/totp/enroll': ok(ENROLLMENT),
    'POST /auth/2fa/totp/confirm': ok({ scratchCodes: CODES }),
    ...routes,
  });
  const { wrapper, router } = await mountApp('/settings/security');
  await button(wrapper, 'Bật').trigger('click');
  await flushPromises();
  return { wrapper, router, calls };
}
async function confirmPassword(wrapper: VueWrapper) {
  await wrapper.get('input[name="totpPassword"]').setValue('mật khẩu');
  await wrapper.get('form[data-step="password"]').trigger('submit');
  await flushPromises();
}
async function enterCode(wrapper: VueWrapper, code = '123456') {
  await codeBoxes(wrapper)[0]!.setValue(code);
  await wrapper.get('form[data-step="scan"]').trigger('submit');
  await flushPromises();
}

describe('Settings › Security › turning on the authenticator app', () => {
  it('goes password, QR and key, first code, then shows the five backup codes once', async () => {
    const { wrapper, calls } = await startEnrolment();
    expect(document.activeElement?.textContent).toBe('Bước 1 · Xác nhận mật khẩu');
    const card = wrapper
      .findAll('#main h2')
      .find((heading) => heading.text() === 'Bật ứng dụng xác thực')!
      .element.closest('section')!;
    expect(card.querySelector('header [data-testid="inline-bit"][data-frame]')).not.toBeNull(); // the padlock Bit on the header
    await confirmPassword(wrapper);
    expect(calls.find((call) => call.path === '/auth/2fa/totp/enroll')!.body).toEqual({
      currentPassword: 'mật khẩu',
    });
    expect(wrapper.get('svg[role="img"]').attributes('aria-label')).toBe(
      'Mã QR để thêm tài khoản vào ứng dụng xác thực',
    );
    expect(wrapper.text()).toContain('JBSW Y3DP EHPK 3PXP');
    expect(
      wrapper.findAll('a').some((link) => link.attributes('href') === ENROLLMENT.otpauthUrl),
    ).toBe(true);
    await enterCode(wrapper);
    expect(calls.find((call) => call.path === '/auth/2fa/totp/confirm')!.body).toEqual({
      code: '123456',
    });
    expect(wrapper.findAll('[data-print-target] li').map((item) => item.text())).toEqual([
      'K7QM-2XRA-9PTD-4WLE',
      'H3ZN-8CVB-5YJF-1MSU',
      'R6DT-0GKE-7NAQ-3HXP',
      'W9LB-4UFC-2ZOV-8TJY',
      'M1EY-5SIP-6RQG-0DNK',
    ]);
    expect(wrapper.text()).toContain('Đang bật');
  });

  it('closes only after the viewer ticks that the codes are saved, and then the codes are gone', async () => {
    const { wrapper } = await startEnrolment();
    await confirmPassword(wrapper);
    await enterCode(wrapper);
    await button(wrapper, 'Xong').trigger('click');
    expect(wrapper.text()).toContain('Hãy đánh dấu là bạn đã lưu các mã trước.');
    await wrapper.get('input[type="checkbox"]').setValue(true);
    await button(wrapper, 'Xong').trigger('click');
    expect(wrapper.text()).not.toContain('K7QM-2XRA-9PTD-4WLE');
    expect(wrapper.find('form[data-step="password"], form[data-step="scan"]').exists()).toBe(false);
    expect(document.activeElement?.tagName).toBe('H2');
    expect(document.activeElement?.textContent).toBe('Xác thực hai bước');
    expect(wrapper.html()).not.toContain('K7QM2XRA9PTD4WLE');
    expect(wrapper.html()).not.toContain('K7QM-2XRA-9PTD-4WLE');
  });

  it('takes the setup key and the QR off the page once the first code is accepted', async () => {
    const { wrapper } = await startEnrolment();
    await confirmPassword(wrapper);
    expect(wrapper.html()).toContain('JBSW Y3DP EHPK 3PXP');
    await enterCode(wrapper);
    expect(wrapper.html()).not.toContain('JBSW Y3DP EHPK 3PXP');
    expect(wrapper.html()).not.toContain(ENROLLMENT.otpauthUrl);
    expect(wrapper.find('svg[role="img"]').exists()).toBe(false);
  });

  it('takes the setup key and the QR off the page when the viewer cancels the scan step', async () => {
    const { wrapper } = await startEnrolment();
    await confirmPassword(wrapper);
    const cancel = wrapper
      .get('form[data-step="scan"]')
      .findAll('button')
      .find((item) => item.text() === 'Hủy')!;
    await cancel.trigger('click');
    await flushPromises();
    expect(wrapper.html()).not.toContain('JBSW Y3DP EHPK 3PXP');
    expect(wrapper.html()).not.toContain(ENROLLMENT.otpauthUrl);
    expect(wrapper.find('form[data-step="password"], form[data-step="scan"]').exists()).toBe(false);
  });

  it('marks the code boxes invalid and points them at the clock hint after a wrong code', async () => {
    const { wrapper } = await startEnrolment({
      'POST /auth/2fa/totp/confirm': fail(400, 'invalid_code'),
    });
    await confirmPassword(wrapper);
    await enterCode(wrapper);
    const alert = wrapper.get('#main [role="alert"]');
    for (const box of codeBoxes(wrapper)) {
      expect(box.attributes('aria-invalid')).toBe('true');
      expect(box.attributes('aria-describedby')).toBe(alert.attributes('id'));
    }
  });

  it('shows how long to wait when enrolment is rate-limited, and stays on step 1', async () => {
    const { wrapper } = await startEnrolment({
      'POST /auth/2fa/totp/enroll': {
        status: 429,
        body: { error: { code: 'rate_limited', message: 'rate_limited' } },
        headers: { 'Retry-After': '42' },
      },
    });
    await confirmPassword(wrapper);
    expect(wrapper.get('#main [role="alert"]').text()).toContain('Thử lại sau 42 giây');
    expect(wrapper.find('form[data-step="password"]').exists()).toBe(true);
  });

  it('shows the codes even when reloading the session afterwards fails', async () => {
    const { wrapper } = await startEnrolment({
      'GET /auth/me': sequence(signedIn(), fail(500, 'http_error')),
    });
    await confirmPassword(wrapper);
    await enterCode(wrapper);
    expect(wrapper.text()).toContain('K7QM-2XRA-9PTD-4WLE');
  });

  it('keeps step 1 with the error on the field after a wrong password', async () => {
    const { wrapper } = await startEnrolment({
      'POST /auth/2fa/totp/enroll': fail(400, 'invalid_credentials', undefined, [
        issue('currentPassword', 'password_incorrect', 'Current password is incorrect.'),
      ]),
    });
    await confirmPassword(wrapper);
    const password = wrapper.get('input[name="totpPassword"]');
    expect(password.attributes('aria-invalid')).toBe('true');
    expect(document.activeElement).toBe(password.element);
  });

  it('keeps the QR after a wrong code, clears the boxes and points at the phone clock', async () => {
    const { wrapper } = await startEnrolment({
      'POST /auth/2fa/totp/confirm': fail(400, 'invalid_code'),
    });
    await confirmPassword(wrapper);
    await enterCode(wrapper);
    expect(wrapper.get('#main [role="alert"]').text()).toContain('Kiểm tra giờ trên điện thoại');
    expect(codeBoxes(wrapper).map((box) => (box.element as HTMLInputElement).value)).toEqual(
      Array(6).fill(''),
    );
    expect(wrapper.find('svg[role="img"]').exists()).toBe(true);
  });

  it('holds the leave in the shared dialog with unconfirmed codes, and stays when the viewer chooses Stay', async () => {
    const { wrapper, router } = await startEnrolment();
    await confirmPassword(wrapper);
    await enterCode(wrapper);
    await router.push('/settings');
    await flushPromises();
    expect(dialog().textContent).toContain('Bạn chưa xác nhận đã lưu mã dự phòng');
    dialogButton('Ở lại').click();
    await flushPromises();
    expect(router.currentRoute.value.name).toBe('settings-security');
    expect(wrapper.text()).toContain('K7QM-2XRA-9PTD-4WLE');
  });

  it('goes back in history when the held leave was a browser Back', async () => {
    const { wrapper, router } = await startEnrolment();
    await confirmPassword(wrapper);
    await enterCode(wrapper);
    window.dispatchEvent(new PopStateEvent('popstate'));
    await router.push('/settings');
    await flushPromises();
    const back = vi.spyOn(router, 'back').mockImplementation(() => undefined);
    const push = vi.spyOn(router, 'push');
    dialogButton('Rời trang').click();
    await flushPromises();
    expect(back).toHaveBeenCalledOnce();
    expect(push).not.toHaveBeenCalled();
  });

  it('leaves once the viewer chooses Leave in the dialog', async () => {
    const { wrapper, router } = await startEnrolment();
    await confirmPassword(wrapper);
    await enterCode(wrapper);
    await router.push('/settings');
    await flushPromises();
    dialogButton('Rời trang').click();
    await vi.waitFor(() => expect(router.currentRoute.value.name).toBe('settings'));
  });
});
