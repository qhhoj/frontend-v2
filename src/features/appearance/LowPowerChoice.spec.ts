import { flushPromises } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { signedOut } from '@/test/fixtures';
import { mockApi } from '@/test/mock-api';
import { mountApp } from '@/test/mount';

const openAppearance = async () => {
  mockApi({ 'GET /auth/me': signedOut });
  const { wrapper } = await mountApp('/settings/appearance');
  await flushPromises();
  return wrapper.get('[data-testid="low-power-section"]');
};
const painted = () => document.documentElement.hasAttribute('data-low-power');

describe('LowPowerChoice', () => {
  it('shows three cards with Automatic chosen and what this device resolves to', async () => {
    const section = await openAppearance();
    expect(section.attributes('id')).toBe('low-power');
    const radios = section.findAll('input[type="radio"]');
    expect(radios.map((radio) => (radio.element as HTMLInputElement).checked)).toEqual([
      true,
      false,
      false,
    ]);
    expect(section.get('[data-testid="low-power-machine"]').text()).toBe('Máy này: đang tắt');
    expect(section.findAll('li')).toHaveLength(7);
  });

  it('turns low-power on for this device only, and says it was saved', async () => {
    const section = await openAppearance();
    await section.get('[data-testid="low-power-on"] input').setValue(true);
    expect(painted()).toBe(true);
    expect(localStorage.getItem('qhhoj.lowPower')).toBe('on');
    expect(section.get('[role="status"]').text()).toContain('Đã lưu trên thiết bị này');
  });

  it('says "on" for Automatic on a weak device', async () => {
    Object.defineProperty(navigator, 'hardwareConcurrency', { value: 2, configurable: true });
    const section = await openAppearance();
    expect(section.get('[data-testid="low-power-machine"]').text()).toBe('Máy này: đang bật');
    expect(painted()).toBe(true);
  });
});
