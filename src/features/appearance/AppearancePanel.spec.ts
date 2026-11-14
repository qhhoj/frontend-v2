import { flushPromises } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { signedOut } from '@/test/fixtures';
import { mockApi } from '@/test/mock-api';
import { blogListRoutes } from '@/test/community-routes';
import { mountApp } from '@/test/mount';

const root = document.documentElement;
const openPanel = async () => {
  mockApi({ ...blogListRoutes, 'GET /auth/me': signedOut });
  const { wrapper, router } = await mountApp('/blog');
  await wrapper.get('button[aria-label="Giao diện"]').trigger('click');
  await flushPromises();
  return { wrapper, router };
};
const panel = () => document.body.querySelector<HTMLElement>('[role="dialog"]')!;
/** A button by its visible text: Mode, Contrast and the footer. */
const buttonNamed = (text: string) =>
  [...panel().querySelectorAll<HTMLButtonElement>('button')].find(
    (button) => button.textContent?.trim() === text,
  )!;
/** An accent swatch by its name (`aria-label`). */
const accentNamed = (name: string) =>
  panel().querySelector<HTMLButtonElement>(`button[aria-label="${name}"]`)!;

describe('appearance panel', () => {
  it('paints the mode, the contrast and the accent', async () => {
    await openPanel();
    expect(accentNamed('Lam').getAttribute('aria-pressed')).toBe('true'); // the site's accent; the look is still off
    accentNamed('Xanh két').click();
    buttonNamed('Cao').click();
    buttonNamed('Tối').click();
    await flushPromises();
    expect(root.dataset.accent).toBe('teal');
    expect(root.dataset.contrast).toBe('high');
    expect(root.dataset.theme).toBe('dark');
  });

  it('uses the site default: look off and mode back to automatic', async () => {
    await openPanel();
    accentNamed('Than chì').click();
    buttonNamed('Sáng').click();
    await flushPromises();
    buttonNamed('Dùng mặc định của trang').click();
    await flushPromises();
    expect(root.dataset.accent).toBeUndefined();
    expect(buttonNamed('Theo máy').getAttribute('aria-pressed')).toBe('true');
    expect(accentNamed('Lam').getAttribute('aria-pressed')).toBe('true');
  });
});
