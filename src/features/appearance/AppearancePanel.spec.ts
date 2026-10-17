import { flushPromises } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { signedOut } from '@/test/fixtures';
import { mockApi } from '@/test/mock-api';
import { blogListRoutes } from '@/test/community-routes';
import { mountApp } from '@/test/mount';

const root = document.documentElement;
/** Glass and Glow only act on a Glass theme; the site default is a Clay theme. */
const useGlassTheme = () => localStorage.setItem('qhhoj.theme', 'glass-dark');
const openPanel = async () => {
  mockApi({ ...blogListRoutes, 'GET /auth/me': signedOut });
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

  it('disables the Glass segments in a Clay theme and says why', async () => {
    await openPanel();
    expect(root.dataset.theme).toBe('clay-light');
    expect(buttonNamed('Mờ').disabled).toBe(true);
    expect(panel().textContent).toContain('Glass và quầng sáng chỉ áp dụng cho giao diện Glass');
    expect(accentNamed('Ocean').disabled).toBe(false);
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
    expect(buttonNamed('Theo máy').getAttribute('aria-pressed')).toBe('true');
  });
});
