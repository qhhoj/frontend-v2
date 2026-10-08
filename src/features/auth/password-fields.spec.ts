import { describe, expect, it } from 'vitest';
import { mountComponent } from '@/test/mount';
import NewPasswordField from './NewPasswordField.vue';
import NewPasswordPair from './NewPasswordPair.vue';

const meterOf = (wrapper: ReturnType<typeof mountComponent>) => wrapper.get('[role="meter"]');

describe('NewPasswordField', () => {
  const mountField = (modelValue: string, props: Record<string, unknown> = {}) =>
    mountComponent(NewPasswordField, { props: { modelValue, ...props } });

  it('uses the new-password autocomplete and starts with an empty meter and no level text', () => {
    const wrapper = mountField('');
    expect(wrapper.get('input').attributes('autocomplete')).toBe('new-password');
    expect(meterOf(wrapper).attributes('aria-valuenow')).toBe('0');
    expect(meterOf(wrapper).attributes('aria-valuetext')).toBe('Chưa nhập mật khẩu');
    expect(wrapper.find('[data-testid="strength-level"]').text()).toBe('');
  });

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

  it('fills as many steps as the score', () => {
    const wrapper = mountField('Abcdef1!');
    expect(wrapper.findAll('[data-step-filled="true"]')).toHaveLength(2);
  });

  it('shows the server message and marks the input invalid', () => {
    const wrapper = mountField('x', { error: 'Mật khẩu này từng bị lộ.' });
    expect(wrapper.get('input').attributes('aria-invalid')).toBe('true');
    expect(wrapper.text()).toContain('Mật khẩu này từng bị lộ.');
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

  it('is quiet while the confirmation is empty or equal', () => {
    expect(mountPair('longer than eight', '').find('[aria-invalid="true"]').exists()).toBe(false);
    expect(
      mountPair('longer than eight', 'longer than eight').find('[aria-invalid="true"]').exists(),
    ).toBe(false);
  });

  it('takes the labels and the field name a screen needs', () => {
    const wrapper = mountPair('', '', {
      name: 'password',
      label: 'Mật khẩu',
      confirmLabel: 'Nhập lại mật khẩu mới',
    });
    const labels = wrapper.findAll('label').map((label) => label.text());
    expect(labels).toEqual(['Mật khẩu', 'Nhập lại mật khẩu mới']);
    expect(wrapper.find('input[name="password"]').exists()).toBe(true);
  });
});
