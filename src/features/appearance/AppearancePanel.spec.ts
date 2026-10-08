import { flushPromises } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { signedOut } from '@/test/fixtures';
import { mockApi } from '@/test/mock-api';
import { mountApp } from '@/test/mount';

const root = document.documentElement;
/** Glass and Glow only act on a Glass theme; the site default is a Clay theme. */
const useGlassTheme = () => localStorage.setItem('qhhoj.theme', 'glass-dark');
const openPanel = async () => {
  mockApi({ 'GET /auth/me': signedOut });
  const { wrapper, router } = await mountApp('/blog');
  await wrapper.get('button[aria-label="Giao diện"]').trigger('click');
  await flushPromises();
  return { wrapper, router };
};
const panel = () => document.body.querySelector<HTMLElement>('[role="dialog"]')!;
/** A button by its visible text: Style, Mode, Glass stops and the footer. */
const buttonNamed = (text: string) =>
  [...panel().querySelectorAll<HTMLButtonElement>('button')].find(
    (button) => button.textContent?.trim() === text,
  )!;
/** An accent swatch by its preset name (`aria-label`; "Clay" is also a Style button's text). */
const accentNamed = (name: string) =>
  panel().querySelector<HTMLButtonElement>(`button[aria-label="${name}"]`)!;

describe('appearance panel', () => {
  it('opens as a named dialog from a button that says it is expanded', async () => {
    const { wrapper } = await openPanel();
    expect(panel().getAttribute('aria-label')).toBe('Giao diện');
    expect(wrapper.get('button[aria-label="Giao diện"]').attributes('aria-expanded')).toBe('true');
  });

  it("turns the look on with the first accent or glass change, from the theme's own look", async () => {
    useGlassTheme();
    await openPanel();
    expect(accentNamed('Orchid').getAttribute('aria-pressed')).toBe('true'); // the Glass themes' own preset; the look is still off
    expect(root.dataset.accent).toBeUndefined();
    accentNamed('Ocean').click();
    await flushPromises();
    expect(root.dataset.accent).toBe('ocean');
    expect(accentNamed('Ocean').getAttribute('aria-pressed')).toBe('true');
    expect(buttonNamed('Trong').getAttribute('aria-pressed')).toBe('true');
    buttonNamed('Mờ').click();
    await flushPromises();
    expect(root.style.getPropertyValue('--qh-glass-level')).toBe('50');
    expect(buttonNamed('Mờ').getAttribute('aria-pressed')).toBe('true');
    buttonNamed('Đặc').click();
    await flushPromises();
    expect(root.style.getPropertyValue('--qh-glass-level')).toBe('100');
  });

  it('highlights the nearest stop for a glass value chosen on the settings page', async () => {
    useGlassTheme();
    localStorage.setItem(
      'qhhoj.appearance',
      JSON.stringify({ accent: 'mint', glass: 80, glow: 100 }),
    );
    localStorage.setItem(
      'qhhoj.paintedAppearance',
      JSON.stringify({ accent: 'mint', glass: 80, glow: 100 }),
    );
    await openPanel();
    expect(buttonNamed('Đặc').getAttribute('aria-pressed')).toBe('true');
    expect(accentNamed('Mint').getAttribute('aria-pressed')).toBe('true');
  });

  it('picking a style and a mode changes the theme and leaves the look off', async () => {
    await openPanel();
    buttonNamed('Glass').click();
    await flushPromises();
    buttonNamed('Sáng').click();
    await flushPromises();
    expect(root.dataset.theme).toBe('glass-light');
    expect(root.dataset.accent).toBeUndefined();
  });

  it('disables the Glass segments in a Clay theme and says why', async () => {
    await openPanel();
    expect(root.dataset.theme).toBe('clay-light');
    expect(buttonNamed('Mờ').disabled).toBe(true);
    expect(panel().textContent).toContain('Glass và quầng sáng chỉ áp dụng cho giao diện Glass');
    expect(accentNamed('Ocean').disabled).toBe(false);
  });

  it('still shows which Glass stop is selected while the segments are disabled', async () => {
    await openPanel();
    const clear = buttonNamed('Trong');
    expect(clear.disabled).toBe(true);
    expect(clear.getAttribute('aria-pressed')).toBe('true');
  });

  it('keeps the Glass segments live on a Glass theme', async () => {
    useGlassTheme();
    await openPanel();
    expect(buttonNamed('Mờ').disabled).toBe(false);
    expect(panel().textContent).not.toContain('Glass và quầng sáng chỉ áp dụng');
  });

  it('uses the site default: look off and mode back to Clay, automatic', async () => {
    await openPanel();
    accentNamed('Gold').click();
    buttonNamed('Glass').click();
    await flushPromises();
    buttonNamed('Sáng').click();
    await flushPromises();
    expect(root.dataset.theme).toBe('glass-light');
    buttonNamed('Dùng mặc định của trang').click();
    await flushPromises();
    expect(root.dataset.accent).toBeUndefined();
    expect(root.dataset.theme).toBe('clay-light');
    expect(buttonNamed('Clay').getAttribute('aria-pressed')).toBe('true');
    expect(buttonNamed('Tự động').getAttribute('aria-pressed')).toBe('true');
  });

  it('links to the settings page', async () => {
    await openPanel();
    const link = [...panel().querySelectorAll('a')].find((anchor) =>
      anchor.textContent?.includes('Thêm trong Cài đặt'),
    )!;
    expect(link.getAttribute('href')).toBe('/settings/appearance');
  });
});
