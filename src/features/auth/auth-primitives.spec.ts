import { flushPromises } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { partialSession, signedIn, signedOut } from '@/test/fixtures';
import { mockApi } from '@/test/mock-api';
import { mountApp, mountComponent } from '@/test/mount';
import AuthError from './AuthError.vue';
import AuthField from './AuthField.vue';
import AuthLayout from './AuthLayout.vue';
import AuthNotice from './AuthNotice.vue';
import AuthSubmit from './AuthSubmit.vue';

describe('auth layout', () => {
  it('drops the pill navigation on the second-factor page, which draws AuthLayout, and keeps the skip link and the main landmark', async () => {
    mockApi({ 'GET /auth/me': signedIn(partialSession()) });
    const { wrapper } = await mountApp('/login/2fa');
    expect(wrapper.find('nav[aria-label="Điều hướng chính"]').exists()).toBe(false);
    expect(wrapper.find('a[href="#main"]').exists()).toBe(true);
    expect(wrapper.find('main#main').exists()).toBe(true);
  });

  it('keeps the shell loading region (outside the page) on auth routes', async () => {
    mockApi({ 'GET /auth/me': signedIn(partialSession()) });
    const { wrapper } = await mountApp('/login/2fa');
    const regions = wrapper.findAll('[role="status"]');
    expect(regions).toHaveLength(1);
    expect(regions[0]!.attributes('aria-live')).toBe('polite');
    expect(wrapper.get('#main').find('[role="status"]').exists()).toBe(false);
  });

  it('keeps the pill navigation on every other route', async () => {
    mockApi({ 'GET /auth/me': signedOut });
    const { wrapper } = await mountApp('/blog');
    expect(wrapper.find('nav[aria-label="Điều hướng chính"]').exists()).toBe(true);
  });

  it('titles the resend page from its route meta', async () => {
    mockApi({ 'GET /auth/me': signedOut });
    await mountApp('/activate');
    expect(document.title).toBe('Gửi lại email kích hoạt · QHHOJ');
  });

  it('renders the title as the page heading, the lead, a home link and a locale toggle in the top bar', () => {
    const wrapper = mountComponent(AuthLayout, { props: { title: 'Tạo tài khoản', lead: 'Lead' } });
    expect(wrapper.get('h1').text()).toBe('Tạo tài khoản');
    expect(wrapper.text()).toContain('Lead');
    expect(wrapper.get('header a').attributes('href')).toBe('/');
    expect(wrapper.find('header button[aria-label="Switch to English"]').exists()).toBe(true);
  });

  it('gives the lead the role a state card asks for', () => {
    const wrapper = mountComponent(AuthLayout, {
      props: { title: 'Liên kết đã hết hạn', lead: 'Dead link', leadRole: 'alert' },
    });
    expect(wrapper.get('[role="alert"]').text()).toBe('Dead link');
  });
});

describe('AuthField', () => {
  const mountField = (props: Record<string, unknown> = {}) =>
    mountComponent(AuthField, {
      props: { label: 'Email', name: 'email', modelValue: '', ...props },
    });

  it('ties the label, the hint and the error to the input', () => {
    const wrapper = mountField({ hint: 'We mail a link.', error: 'Enter a valid email address.' });
    const input = wrapper.get('input');
    expect(wrapper.get(`label[for="${input.attributes('id')}"]`).text()).toBe('Email');
    expect(input.attributes('aria-invalid')).toBe('true');
    const described = input.attributes('aria-describedby')!.split(' ');
    const texts = described.map((id) => wrapper.get(`[id="${id}"]`).text());
    expect(texts).toEqual(['Enter a valid email address.', 'We mail a link.']);
  });

  it('is valid and undescribed without hint or error', () => {
    const input = mountField().get('input');
    expect(input.attributes('aria-invalid')).toBeUndefined();
    expect(input.attributes('aria-describedby')).toBeUndefined();
  });

  it('marks a negative tone invalid without an error text', () => {
    expect(mountField({ tone: 'negative' }).get('input').attributes('aria-invalid')).toBe('true');
    expect(
      mountField({ tone: 'positive' }).get('input').attributes('aria-invalid'),
    ).toBeUndefined();
  });

  it('passes autocomplete, type and forwarded attributes to the input and updates the model', async () => {
    const wrapper = mountField({ type: 'email', autocomplete: 'email', required: true });
    const input = wrapper.get('input');
    expect(input.attributes('type')).toBe('email');
    expect(input.attributes('autocomplete')).toBe('email');
    expect(input.attributes('required')).toBeDefined();
    await input.setValue('a@b.co');
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['a@b.co']);
  });

  it('adds extra describing ids', () => {
    const wrapper = mountField({ describedBy: 'strength-1' });
    expect(wrapper.get('input').attributes('aria-describedby')).toBe('strength-1');
  });

  it('lets a password be shown and hidden again with a pressed toggle', async () => {
    const wrapper = mountField({ type: 'password', name: 'password', label: 'Mật khẩu' });
    const toggle = wrapper.get('button[type="button"]');
    expect(toggle.attributes('aria-label')).toBe('Hiện mật khẩu');
    expect(toggle.attributes('aria-pressed')).toBe('false');
    await toggle.trigger('click');
    expect(wrapper.get('input').attributes('type')).toBe('text');
    expect(toggle.attributes('aria-pressed')).toBe('true');
    expect(toggle.attributes('aria-label')).toBe('Hiện mật khẩu');
    await toggle.trigger('click');
    expect(wrapper.get('input').attributes('type')).toBe('password');
  });

  it('has no visibility toggle on other inputs', () => {
    expect(mountField().find('button').exists()).toBe(false);
  });

  it('puts label-end content on the label row, outside the label', () => {
    const wrapper = mountComponent(AuthField, {
      props: { label: 'Tên hiển thị', name: 'firstName', modelValue: '' },
      slots: { 'label-end': '<span data-counter>3 / 30</span>' },
    });
    expect(wrapper.get('label').text()).toBe('Tên hiển thị');
    expect(
      wrapper.get('label').element.parentElement!.querySelector('[data-counter]'),
    ).not.toBeNull();
  });
});

describe('AuthError, AuthNotice and AuthSubmit', () => {
  it('announces an error as an alert, with an inline action, and renders nothing without text', () => {
    const wrapper = mountComponent(AuthError, {
      props: { text: 'Boom.' },
      slots: { default: '<a href="/activate">Again</a>' },
    });
    expect(wrapper.get('[role="alert"]').text()).toBe('Boom. Again');
    expect(
      mountComponent(AuthError, { props: { text: null } })
        .find('[role="alert"]')
        .exists(),
    ).toBe(false);
  });

  it('announces a notice as a status and offers a dismiss button only when asked', async () => {
    const plain = mountComponent(AuthNotice, { slots: { default: 'Saved.' } });
    expect(plain.get('[role="status"]').text()).toBe('Saved.');
    expect(plain.find('button').exists()).toBe(false);
    const dismissible = mountComponent(AuthNotice, {
      props: { dismissible: true },
      slots: { default: 'Saved.' },
    });
    await dismissible.get('button[aria-label="Đóng thông báo"]').trigger('click');
    expect(dismissible.emitted('dismiss')).toHaveLength(1);
  });

  it('marks a pending submit busy without disabling it', async () => {
    const wrapper = mountComponent(AuthSubmit, {
      props: { pending: true },
      slots: { default: 'Go' },
    });
    await flushPromises();
    const button = wrapper.get('button');
    expect(button.attributes('type')).toBe('submit');
    expect(button.attributes('aria-busy')).toBe('true');
    expect(button.attributes('aria-disabled')).toBe('true');
    expect(button.attributes('disabled')).toBeUndefined();
  });
});
