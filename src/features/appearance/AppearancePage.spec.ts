import { flushPromises } from '@vue/test-utils';
import type { VueWrapper } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { profile, signedIn, signedOut } from '@/test/fixtures';
import { stubMatchMedia } from '@/test/match-media';
import { mockApi, ok } from '@/test/mock-api';
import { mountApp } from '@/test/mount';

const root = document.documentElement;
/** Glass and Glow only act on a Glass theme; the site default is a Clay theme. */
const useGlassTheme = () => localStorage.setItem('qhhoj.theme', 'glass-dark');
const echoProfile = {
  'GET /profile': ok(profile()),
  'PATCH /profile': ({ body }: { body: unknown }) => ok(profile(body as object)),
};
const patches = (calls: Array<{ method: string; body: unknown }>) =>
  calls.filter((call) => call.method === 'PATCH').map((call) => call.body);
/** The button labelled `label` in the group named `group` ("Kiểu" is Style, "Chế độ" is Mode). */
const choiceIn = (wrapper: VueWrapper, group: string, label: string) =>
  wrapper
    .findAll(`[role="group"][aria-label="${group}"] button`)
    .find((button) => button.text() === label)!;

describe('Settings › Appearance', () => {
  it('starts with the look off: presets and sliders are disabled, Style and Mode are not', async () => {
    mockApi({ 'GET /auth/me': signedOut });
    const { wrapper } = await mountApp('/settings/appearance');
    expect(document.title).toBe('Giao diện · QHHOJ');
    expect(wrapper.get('[role="switch"]').attributes('aria-checked')).toBe('false');
    expect(wrapper.get('button[aria-label="Ocean"]').attributes('disabled')).toBeDefined();
    expect(wrapper.get('#glass-level').attributes('disabled')).toBeDefined();
    expect(wrapper.get('#glow-level').attributes('disabled')).toBeDefined();
    for (const group of ['Kiểu', 'Chế độ'])
      for (const button of wrapper.findAll(`[role="group"][aria-label="${group}"] button`))
        expect(button.attributes('disabled'), `${group} ${button.text()}`).toBeUndefined();
    expect(root.dataset.accent).toBeUndefined();
    expect(wrapper.get('p[role="status"]').text()).toBe('Đang dùng giao diện của trang');
  });

  it("turning it on paints the theme's own look and keeps it in this browser for an anonymous visitor", async () => {
    const calls = mockApi({ 'GET /auth/me': signedOut });
    const { wrapper } = await mountApp('/settings/appearance');
    expect(wrapper.get('button[aria-label="Clay"]').attributes('aria-pressed')).toBe('true');
    await wrapper.get('[role="switch"]').trigger('click');
    expect(wrapper.get('[role="switch"]').attributes('aria-checked')).toBe('true');
    expect(root.dataset.accent).toBe('clay');
    expect(wrapper.get('button[aria-label="Clay"]').attributes('aria-pressed')).toBe('true');
    expect(wrapper.get('button[aria-label="Ocean"]').attributes('disabled')).toBeUndefined();
    expect(wrapper.get('p[role="status"]').text()).toContain('trình duyệt này');
    expect(patches(calls)).toEqual([]);
  });

  it('turning it on in a Glass theme starts from Orchid, the Glass themes own preset', async () => {
    useGlassTheme();
    mockApi({ 'GET /auth/me': signedOut });
    const { wrapper } = await mountApp('/settings/appearance');
    expect(wrapper.get('button[aria-label="Orchid"]').attributes('aria-pressed')).toBe('true');
    await wrapper.get('[role="switch"]').trigger('click');
    expect(root.dataset.accent).toBe('orchid');
    expect(wrapper.get('button[aria-label="Orchid"]').attributes('aria-pressed')).toBe('true');
  });

  it('picks an accent and shows which one is pressed', async () => {
    mockApi({ 'GET /auth/me': signedOut });
    const { wrapper } = await mountApp('/settings/appearance');
    await wrapper.get('[role="switch"]').trigger('click');
    await wrapper.get('button[aria-label="Ocean"]').trigger('click');
    expect(root.dataset.accent).toBe('ocean');
    expect(wrapper.get('button[aria-label="Ocean"]').attributes('aria-pressed')).toBe('true');
    expect(wrapper.get('button[aria-label="Clay"]').attributes('aria-pressed')).toBe('false');
  });

  it('a slider paints while it moves and saves once when released', async () => {
    // The account's mode outranks the browser's, so the account itself is on a Glass theme (the sliders are inert in Clay).
    const calls = mockApi({
      'GET /auth/me': signedIn(),
      'GET /profile': ok(profile({ siteTheme: 'glass-dark' })),
      'PATCH /profile': ({ body }: { body: unknown }) =>
        ok(profile({ siteTheme: 'glass-dark', ...(body as object) })),
    });
    const { wrapper } = await mountApp('/settings/appearance');
    await wrapper.get('[role="switch"]').trigger('click');
    await flushPromises();
    expect(patches(calls)).toEqual([{ appearance: { accent: 'orchid', glass: 0, glow: 100 } }]);
    const glass = wrapper.get('#glass-level');
    // `setValue` would fire `change` as well; a real drag only fires `input` until the release.
    (glass.element as HTMLInputElement).value = '40';
    await glass.trigger('input');
    expect(root.style.getPropertyValue('--qh-glass-level')).toBe('40');
    expect(patches(calls)).toHaveLength(1);
    await glass.trigger('change');
    await flushPromises();
    expect(patches(calls).at(-1)).toEqual({
      appearance: { accent: 'orchid', glass: 40, glow: 100 },
    });
  });

  it('names the glass level in words next to the number it sets', async () => {
    useGlassTheme();
    mockApi({ 'GET /auth/me': signedOut });
    const { wrapper } = await mountApp('/settings/appearance');
    await wrapper.get('[role="switch"]').trigger('click');
    expect(wrapper.get('label[for="glass-level"]').element.parentElement?.textContent).toContain(
      'Trong',
    );
    await wrapper.get('#glass-level').setValue('50');
    expect(wrapper.get('label[for="glass-level"]').element.parentElement?.textContent).toContain(
      'Mờ',
    );
    await wrapper.get('#glass-level').setValue('90');
    expect(wrapper.get('label[for="glass-level"]').element.parentElement?.textContent).toContain(
      'Đặc',
    );
  });

  it('says where it is saved: this browser, or the account', async () => {
    mockApi({ 'GET /auth/me': signedIn(), ...echoProfile });
    const { wrapper } = await mountApp('/settings/appearance');
    await wrapper.get('[role="switch"]').trigger('click');
    await flushPromises();
    expect(wrapper.get('p[role="status"]').text()).toContain('tài khoản');
  });

  it('picking a style and a mode saves only the mode and leaves the look off', async () => {
    const calls = mockApi({ 'GET /auth/me': signedIn(), ...echoProfile });
    const { wrapper } = await mountApp('/settings/appearance');
    await choiceIn(wrapper, 'Kiểu', 'Glass').trigger('click');
    await flushPromises();
    await choiceIn(wrapper, 'Chế độ', 'Sáng').trigger('click');
    await flushPromises();
    expect(patches(calls)).toEqual([{ siteTheme: 'glass-auto' }, { siteTheme: 'glass-light' }]);
    expect(root.dataset.theme).toBe('glass-light');
    expect(wrapper.get('[role="switch"]').attributes('aria-checked')).toBe('false');
    expect(root.dataset.accent).toBeUndefined();
  });

  it.each([
    ['auto', 'Clay', 'Tự động'],
    ['clay-dark', 'Clay', 'Tối'],
    ['dark', 'Clay', 'Tối'], // legacy value: now Clay
    ['glass-auto', 'Glass', 'Tự động'],
    ['glass-light', 'Glass', 'Sáng'],
  ])('shows the stored preference %s as %s, %s', async (stored, style, mode) => {
    localStorage.setItem('qhhoj.theme', stored);
    mockApi({ 'GET /auth/me': signedOut });
    const { wrapper } = await mountApp('/settings/appearance');
    const pressed = (group: string) =>
      wrapper
        .findAll(`[role="group"][aria-label="${group}"] button[aria-pressed="true"]`)
        .map((button) => button.text());
    expect(pressed('Kiểu')).toEqual([style]);
    expect(pressed('Chế độ')).toEqual([mode]);
  });

  it('resets the look and the mode to the site default', async () => {
    const calls = mockApi({ 'GET /auth/me': signedIn(), ...echoProfile });
    const { wrapper } = await mountApp('/settings/appearance');
    await wrapper.get('[role="switch"]').trigger('click');
    await wrapper.get('button[aria-label="Gold"]').trigger('click');
    const reset = wrapper
      .findAll('button')
      .find((button) => button.text() === 'Về mặc định của trang')!;
    await reset.trigger('click');
    await flushPromises();
    expect(patches(calls).at(-1)).toEqual({ appearance: null, siteTheme: 'auto' });
    expect(wrapper.get('[role="switch"]').attributes('aria-checked')).toBe('false');
    expect(root.dataset.accent).toBeUndefined();
  });

  it("shows the account's saved look when the page opens", async () => {
    mockApi({
      'GET /auth/me': signedIn(),
      'GET /profile': ok(profile({ appearance: { accent: 'ocean', glass: 40, glow: 60 } })),
    });
    const { wrapper } = await mountApp('/settings/appearance');
    expect(wrapper.get('[role="switch"]').attributes('aria-checked')).toBe('true');
    expect(wrapper.get('button[aria-label="Ocean"]').attributes('aria-pressed')).toBe('true');
    expect((wrapper.get('#glass-level').element as HTMLInputElement).value).toBe('40');
    expect((wrapper.get('#glow-level').element as HTMLInputElement).value).toBe('60');
  });

  it('disables Glass and Glow in a Clay theme with one line of reason, and keeps what was stored', async () => {
    const stored = JSON.stringify({ accent: 'ocean', glass: 40, glow: 60 });
    localStorage.setItem('qhhoj.appearance', stored);
    localStorage.setItem('qhhoj.paintedAppearance', stored);
    mockApi({ 'GET /auth/me': signedOut });
    const { wrapper } = await mountApp('/settings/appearance');
    expect(root.dataset.theme).toBe('clay-light');
    expect(wrapper.get('#glass-level').attributes('disabled')).toBeDefined();
    expect(wrapper.get('#glow-level').attributes('disabled')).toBeDefined();
    expect(wrapper.text()).toContain('Glass và quầng sáng chỉ áp dụng cho giao diện Glass');
    expect(wrapper.get('button[aria-label="Ocean"]').attributes('disabled')).toBeUndefined();
    expect((wrapper.get('#glass-level').element as HTMLInputElement).value).toBe('40');
    expect((wrapper.get('#glow-level').element as HTMLInputElement).value).toBe('60');
  });

  it('enables Glass and Glow on a Glass theme, with no reason shown', async () => {
    useGlassTheme();
    const stored = JSON.stringify({ accent: 'ocean', glass: 40, glow: 60 });
    localStorage.setItem('qhhoj.appearance', stored);
    localStorage.setItem('qhhoj.paintedAppearance', stored);
    mockApi({ 'GET /auth/me': signedOut });
    const { wrapper } = await mountApp('/settings/appearance');
    expect(wrapper.get('#glass-level').attributes('disabled')).toBeUndefined();
    expect(wrapper.get('#glow-level').attributes('disabled')).toBeUndefined();
    expect(wrapper.text()).not.toContain('Glass và quầng sáng chỉ áp dụng');
  });

  it('keeps the Glass slider inert and explains why when the device asks for less transparency', async () => {
    useGlassTheme();
    stubMatchMedia().setQuery('(prefers-reduced-transparency: reduce)', true);
    mockApi({ 'GET /auth/me': signedOut });
    const { wrapper } = await mountApp('/settings/appearance');
    await wrapper.get('[role="switch"]').trigger('click');
    expect(wrapper.get('#glass-level').attributes('disabled')).toBeDefined();
    expect(wrapper.text()).toContain('Thiết bị của bạn yêu cầu giảm độ trong suốt');
    expect(wrapper.get('#glow-level').attributes('disabled')).toBeUndefined();
  });

  it('shows Bit beside the title as decoration only', async () => {
    mockApi({ 'GET /auth/me': signedOut });
    const { wrapper } = await mountApp('/settings/appearance');
    const bit = wrapper.get('[data-testid="appearance-bit"]');
    expect(bit.attributes('aria-hidden')).toBe('true');
    expect(bit.attributes('role')).toBeUndefined();
  });

  it('turning the look off again returns to the site look and saves that', async () => {
    const calls = mockApi({ 'GET /auth/me': signedIn(), ...echoProfile });
    const { wrapper } = await mountApp('/settings/appearance');
    await wrapper.get('[role="switch"]').trigger('click');
    await flushPromises();
    await wrapper.get('[role="switch"]').trigger('click');
    await flushPromises();
    expect(wrapper.get('[role="switch"]').attributes('aria-checked')).toBe('false');
    expect(root.dataset.accent).toBeUndefined();
    expect(patches(calls).at(-1)).toEqual({ appearance: null });
  });
});
