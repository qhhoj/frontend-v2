import { describe, expect, it } from 'vitest';
import { mountComponent } from '@/test/mount';
import NewPasswordField from './NewPasswordField.vue';
import NewPasswordPair from './NewPasswordPair.vue';

const meterOf = (wrapper: ReturnType<typeof mountComponent>) => wrapper.get('[role="meter"]');

describe('NewPasswordField', () => {
  const mountField = (modelValue: string, props: Record<string, unknown> = {}) =>
    mountComponent(NewPasswordField, { props: { modelValue, ...props } });

  it('reflects the estimated strength in the meter and names it in text, linked to the input', () => {
    const wrapper = mountField('correct horse battery staple');
    expect(meterOf(wrapper).attributes('aria-valuenow')).toBe('4');
    expect(wrapper.get('[data-testid="strength-level"]').text()).toBe('Rất mạnh');
    const describedBy = wrapper.get('input').attributes('aria-describedby')!;
    expect(wrapper.get(`[id="${describedBy}"]`).text()).toContain('Rất mạnh');
  });

  it('adds the tip below strong and weighs the owner name', () => {
    const wrapper = mountField('user_01 loves tea 2026', { owner: { username: 'user_01' } });
    expect(meterOf(wrapper).attributes('aria-valuenow')).toBe('1');
    expect(wrapper.get('[data-testid="strength-level"]').text()).toBe(
      'Yếu — thêm ký tự đặc biệt hoặc vài từ nữa',
    );
  });
});

describe('NewPasswordPair', () => {
  const mountPair = (password: string, confirmation: string, props: Record<string, unknown> = {}) =>
    mountComponent(NewPasswordPair, { props: { password, confirmation, ...props } });

  it('names the inputs for the backend field and flags a mismatch', () => {
    const wrapper = mountPair('longer than eight', 'longer than eigh');
    expect(wrapper.find('input[name="newPassword"]').exists()).toBe(true);
    const confirm = wrapper.get('input[name="confirmPassword"]');
    expect(confirm.attributes('aria-invalid')).toBe('true');
    expect(wrapper.text()).toContain('Hai mật khẩu chưa khớp');
  });
});
