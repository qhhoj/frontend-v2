import { flushPromises } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CPP17_ID, PY3_ID, organizationItem, signedOut } from '@/test/fixtures';
import { registerRoutes } from '@/test/auth-routes';
import { fail, invalid, issue, mockApi, noContent, ok } from '@/test/mock-api';
import type { MockHandler } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { openSelect, pickOption } from '@/test/select';

type Wrapper = Awaited<ReturnType<typeof mountApp>>['wrapper'];
const PASSWORD = 'long enough password';

const fill = async (
  wrapper: Wrapper,
  values: { username?: string; email?: string; confirmation?: string; rules?: boolean } = {},
) => {
  await wrapper.get('input[name="username"]').setValue(values.username ?? 'new_user');
  await wrapper.get('input[name="email"]').setValue(values.email ?? 'new@example.com');
  await wrapper.get('input[name="password"]').setValue(PASSWORD);
  await wrapper.get('input[name="confirmPassword"]').setValue(values.confirmation ?? PASSWORD);
  if (values.rules ?? true) await wrapper.get('input[name="rules"]').setValue(true);
  await wrapper.get('form').trigger('submit');
  await flushPromises();
};

const register = (reply: MockHandler = noContent(), overrides: Record<string, MockHandler> = {}) =>
  mockApi({
    'GET /auth/me': signedOut,
    ...registerRoutes,
    'GET /auth/username-available': ok({ available: true }),
    'POST /auth/register': reply,
    ...overrides,
  });
const registerBody = (calls: ReturnType<typeof register>) =>
  calls.find((call) => call.path === '/auth/register')?.body;
const describedText = (wrapper: Wrapper, name: string) =>
  wrapper
    .get(`input[name="${name}"]`)
    .attributes('aria-describedby')!
    .split(' ')
    .map((id) => wrapper.get(`[id="${id}"]`).text());

afterEach(() => void vi.useRealTimers());

describe('register page', () => {
  it('sends what the viewer filled in, with the C++17 default, then shows where the mail went', async () => {
    const calls = register();
    const { wrapper } = await mountApp('/register');
    await fill(wrapper);
    expect(registerBody(calls)).toEqual({
      username: 'new_user',
      email: 'new@example.com',
      password: PASSWORD,
      languageId: CPP17_ID,
    });
    expect(wrapper.get('h1').text()).toBe('Kiểm tra hộp thư');
    expect(wrapper.get('#main [role="status"]').text()).toContain('n***@example.com');
    expect(wrapper.find('input[name="username"]').exists()).toBe(false);
    expect(document.activeElement).toBe(document.getElementById('main'));
  });

  it('sends the school and the language the viewer chose instead of the default', async () => {
    const calls = register();
    const { wrapper } = await mountApp('/register');
    await openSelect(wrapper, '[data-testid="school-picker"]');
    await pickOption(organizationItem().name);
    await wrapper.get('select[name="languageId"]').setValue(PY3_ID);
    await fill(wrapper);
    expect(registerBody(calls)).toEqual({
      username: 'new_user',
      email: 'new@example.com',
      password: PASSWORD,
      organizationId: organizationItem().id,
      languageId: PY3_ID,
    });
  });

  it('still registers when the school list cannot load', async () => {
    const calls = register(noContent(), { 'GET /organizations': fail(404, 'not_found') });
    const { wrapper } = await mountApp('/register');
    expect(wrapper.find('[data-testid="school-picker"]').exists()).toBe(false);
    await fill(wrapper);
    expect(registerBody(calls)).toMatchObject({ username: 'new_user', email: 'new@example.com' });
  });

  it('will not submit until the rules are accepted, and focuses the box', async () => {
    const calls = register();
    const { wrapper } = await mountApp('/register');
    await fill(wrapper, { rules: false });
    expect(registerBody(calls)).toBeUndefined();
    const checkbox = wrapper.get('input[name="rules"]');
    expect(checkbox.attributes('aria-invalid')).toBe('true');
    expect(document.activeElement).toBe(checkbox.element);
    expect(wrapper.text()).toContain('Hãy đồng ý với điều khoản để tiếp tục.');
    await checkbox.setValue(true);
    expect(checkbox.attributes('aria-invalid')).toBeUndefined();
  });

  it('will not submit a username the backend would reject, and focuses it', async () => {
    const calls = register();
    const { wrapper } = await mountApp('/register');
    await fill(wrapper, { username: 'bad name' });
    expect(registerBody(calls)).toBeUndefined();
    expect(document.activeElement).toBe(wrapper.get('input[name="username"]').element);
  });

  it('will not submit two different passwords, and focuses the confirmation', async () => {
    const calls = register();
    const { wrapper } = await mountApp('/register');
    await fill(wrapper, { confirmation: `${PASSWORD}X` });
    expect(registerBody(calls)).toBeUndefined();
    expect(document.activeElement).toBe(wrapper.get('input[name="confirmPassword"]').element);
  });

  it('does not let the availability answer block a submit', async () => {
    const calls = register(noContent(), {
      'GET /auth/username-available': ok({ available: false }),
    });
    const { wrapper } = await mountApp('/register');
    await wrapper.get('input[name="username"]').setValue('new_user');
    await vi.waitFor(() => expect(wrapper.text()).toContain('Tên đã có người dùng'));
    await fill(wrapper);
    expect(registerBody(calls)).toMatchObject({ username: 'new_user' });
  });

  it('puts the translated issue of each field under its input, by code, and focuses the first', async () => {
    register(
      invalid(
        issue('username', 'username_taken', 'Username is taken.'),
        issue('email', 'email_taken', 'Email is already registered.'),
        issue('password', 'password_pwned', 'This password has appeared in a data breach.'),
      ),
    );
    const { wrapper } = await mountApp('/register');
    await fill(wrapper);
    expect(describedText(wrapper, 'username')).toContain('Tên đăng nhập đã được dùng.');
    expect(describedText(wrapper, 'email')).toEqual([
      'Email này đã được đăng ký. Hãy đăng nhập hoặc đặt lại mật khẩu.',
    ]);
    expect(describedText(wrapper, 'password')).toContain(
      'Mật khẩu này từng bị lộ trong một vụ rò rỉ dữ liệu.',
    );
    expect(document.activeElement).toBe(wrapper.get('input[name="username"]').element);
    expect(wrapper.find('#main [role="alert"]').exists()).toBe(false);
  });

  it('shows a refused school at its picker and focuses it', async () => {
    register(
      invalid(
        issue(
          'organizationId',
          'organization_unavailable',
          'Choose one of the listed open organizations.',
        ),
      ),
    );
    const { wrapper } = await mountApp('/register');
    await openSelect(wrapper, '[data-testid="school-picker"]');
    await pickOption(organizationItem().name);
    await fill(wrapper);
    const combobox = wrapper.get('[data-testid="school-picker"] [role="combobox"]');
    expect(combobox.attributes('aria-invalid')).toBe('true');
    expect(wrapper.text()).toContain('Trường này không nhận thành viên mới');
    expect(document.activeElement).toBe(combobox.element);
  });

  it('still reads an older answer that has fields but no issues', async () => {
    register(fail(400, 'validation_failed', { email: ['Enter a valid email address.'] }));
    const { wrapper } = await mountApp('/register');
    await fill(wrapper, { email: 'bad@x' });
    expect(describedText(wrapper, 'email')).toEqual(['Enter a valid email address.']);
  });

  it('drops a server message once the viewer edits that field', async () => {
    register(
      invalid(
        issue('username', 'username_taken', 'Username is taken.'),
        issue('email', 'email_taken', 'Email is already registered.'),
      ),
    );
    const { wrapper } = await mountApp('/register');
    await fill(wrapper);
    await wrapper.get('input[name="email"]').setValue('other@example.com');
    expect(wrapper.get('input[name="email"]').attributes('aria-invalid')).toBeUndefined();
    expect(describedText(wrapper, 'username')).toContain('Tên đăng nhập đã được dùng.');
  });

  it('keeps a field error out of the input label', async () => {
    register(invalid(issue('email', 'email_invalid', 'Enter a valid email address.')));
    const { wrapper } = await mountApp('/register');
    await fill(wrapper, { email: 'bad@x' });
    const email = wrapper.get('input[name="email"]');
    expect(wrapper.get(`label[for="${email.attributes('id')}"]`).text()).toBe('Email');
  });

  it('announces a throttled attempt as an alert and keeps the form', async () => {
    register(fail(429, 'rate_limited'));
    const { wrapper } = await mountApp('/register');
    await fill(wrapper);
    expect(wrapper.get('#main [role="alert"]').text()).toBe(
      'Bạn thao tác quá nhanh. Hãy thử lại sau.',
    );
    expect(wrapper.find('form').exists()).toBe(true);
  });

  it('turns an unavailable mailer into the "registration unavailable" card', async () => {
    register(fail(503, 'mail_unavailable'));
    const { wrapper } = await mountApp('/register');
    await fill(wrapper);
    expect(wrapper.get('h1').text()).toBe('Đăng ký tạm thời không khả dụng');
    expect(wrapper.get('#main [role="alert"]').text()).toBe(
      'Máy chủ chưa thể gửi email xác nhận. Vui lòng thử lại sau hoặc liên hệ quản trị viên.',
    );
    expect(wrapper.get('#main a[href="/login"]').text()).toBe('Về trang đăng nhập');
    expect(wrapper.find('form').exists()).toBe(false);
  });

  it('weighs the password against the typed username in the strength meter', async () => {
    register();
    const { wrapper } = await mountApp('/register');
    await wrapper.get('input[name="password"]').setValue('user_01 loves tea 2026');
    expect(wrapper.get('[role="meter"]').attributes('aria-valuenow')).toBe('4');
    await wrapper.get('input[name="username"]').setValue('user_01');
    expect(wrapper.get('[role="meter"]').attributes('aria-valuenow')).toBe('1');
  });

  it('links to sign-in from the top bar and the footer, and offers no social sign-up', async () => {
    register();
    const { wrapper } = await mountApp('/register');
    expect(wrapper.find('header a[href="/login"]').exists()).toBe(true);
    expect(wrapper.find('form a[href="/login"]').exists()).toBe(true);
    expect(wrapper.find('a[href^="/api/internal/auth/social/"]').exists()).toBe(false);
  });

  it('sends the activation mail again to the registered address once the cooldown is over', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
    const calls = register(noContent(), { 'POST /auth/activate/resend': noContent() });
    const { wrapper } = await mountApp('/register');
    await fill(wrapper);
    vi.advanceTimersByTime(60_000);
    await flushPromises();
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Gửi lại email')!
      .trigger('click');
    await flushPromises();
    expect(calls.find((call) => call.path === '/auth/activate/resend')?.body).toEqual({
      email: 'new@example.com',
    });
  });

  it('goes back to the filled form from "Sai email? Đăng ký lại"', async () => {
    register();
    const { wrapper } = await mountApp('/register');
    await fill(wrapper);
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Đăng ký lại')!
      .trigger('click');
    expect((wrapper.get('input[name="email"]').element as HTMLInputElement).value).toBe(
      'new@example.com',
    );
  });
});
