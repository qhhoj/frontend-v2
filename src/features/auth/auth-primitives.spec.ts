import { flushPromises } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { partialSession, signedIn } from '@/test/fixtures';
import { mockApi } from '@/test/mock-api';
import { blogListRoutes } from '@/test/community-routes';
import { mountApp, mountComponent } from '@/test/mount';
import AuthField from './AuthField.vue';
import AuthSubmit from './AuthSubmit.vue';

describe('auth layout', () => {
  it('drops the pill navigation on the second-factor page, which draws AuthLayout, and keeps the skip link and the main landmark', async () => {
    mockApi({ ...blogListRoutes, 'GET /auth/me': signedIn(partialSession()) });
    const { wrapper } = await mountApp('/login/2fa');
    expect(wrapper.find('nav[aria-label="Điều hướng chính"]').exists()).toBe(false);
    expect(wrapper.find('a[href="#main"]').exists()).toBe(true);
    expect(wrapper.find('main#main').exists()).toBe(true);
  });

  it('keeps the shell loading region (outside the page) on auth routes', async () => {
    mockApi({ ...blogListRoutes, 'GET /auth/me': signedIn(partialSession()) });
    const { wrapper } = await mountApp('/login/2fa');
    const regions = wrapper.findAll('[role="status"]');
    expect(regions).toHaveLength(1);
    expect(regions[0]!.attributes('aria-live')).toBe('polite');
    expect(wrapper.get('#main').find('[role="status"]').exists()).toBe(false);
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
});

describe('AuthError, AuthNotice and AuthSubmit', () => {
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
