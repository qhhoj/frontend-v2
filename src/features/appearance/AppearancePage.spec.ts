import { flushPromises } from '@vue/test-utils';
import type { VueWrapper } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { profile, signedIn, signedOut } from '@/test/fixtures';
import { mockApi, ok } from '@/test/mock-api';
import { mountApp } from '@/test/mount';

const root = document.documentElement;
const echoProfile = {
  'GET /profile': ok(profile()),
  'PATCH /profile': ({ body }: { body: unknown }) => ok(profile(body as object)),
};
const patches = (calls: Array<{ method: string; body: unknown }>) =>
  calls.filter((call) => call.method === 'PATCH').map((call) => call.body);
/** The button labelled `label` in the group named `group` ("Chế độ" is Mode, "Độ tương phản" Contrast, "Nền trang" Background). */
const choiceIn = (wrapper: VueWrapper, group: string, label: string) =>
  wrapper
    .findAll(`[role="group"][aria-label="${group}"] button`)
    .find((button) => button.text() === label)!;

describe('Settings › Appearance', () => {
  it('paints an accent and keeps it in this browser for an anonymous visitor', async () => {
    const calls = mockApi({ 'GET /auth/me': signedOut });
    const { wrapper } = await mountApp('/settings/appearance');
    expect(wrapper.get('button[aria-label="Lam"]').attributes('aria-pressed')).toBe('true');
    expect(root.dataset.accent).toBeUndefined();
    await wrapper.get('button[aria-label="Mận"]').trigger('click');
    expect(root.dataset.accent).toBe('plum');
    expect(wrapper.get('button[aria-label="Mận"]').attributes('aria-pressed')).toBe('true');
    expect(wrapper.get('p[role="status"]').text()).toContain('trình duyệt này');
    expect(patches(calls)).toEqual([]);
  });

  it('shows Blueprint as the background until one is picked, then paints and saves the pick', async () => {
    const calls = mockApi({ 'GET /auth/me': signedIn(), ...echoProfile });
    const { wrapper } = await mountApp('/settings/appearance');
    const pressed = () =>
      wrapper
        .findAll('[role="group"][aria-label="Nền trang"] button[aria-pressed="true"]')
        .map((button) => button.text());
    expect(pressed()).toEqual(['Bản vẽ']);
    expect(root.dataset.background).toBe('blueprint');
    await choiceIn(wrapper, 'Nền trang', 'Đường đồng mức').trigger('click');
    await flushPromises();
    expect(pressed()).toEqual(['Đường đồng mức']);
    expect(root.dataset.background).toBe('contour');
    expect(patches(calls)).toEqual([
      { appearance: { accent: 'ultramarine', background: 'contour' } },
    ]);
    await choiceIn(wrapper, 'Nền trang', 'Bản vẽ').trigger('click');
    await flushPromises();
    expect(patches(calls).at(-1)).toEqual({ appearance: { accent: 'ultramarine' } });
  });

  it('paints high contrast and saves it with the look', async () => {
    const calls = mockApi({ 'GET /auth/me': signedIn(), ...echoProfile });
    const { wrapper } = await mountApp('/settings/appearance');
    await choiceIn(wrapper, 'Độ tương phản', 'Cao').trigger('click');
    await flushPromises();
    expect(root.dataset.contrast).toBe('high');
    expect(patches(calls)).toEqual([{ appearance: { accent: 'ultramarine', contrast: 'high' } }]);
  });

  it('picking a mode saves only the mode and leaves the look off', async () => {
    const calls = mockApi({ 'GET /auth/me': signedIn(), ...echoProfile });
    const { wrapper } = await mountApp('/settings/appearance');
    await choiceIn(wrapper, 'Chế độ', 'Tối').trigger('click');
    await flushPromises();
    expect(patches(calls)).toEqual([{ siteTheme: 'dark' }]);
    expect(root.dataset.theme).toBe('dark');
    expect(root.dataset.accent).toBeUndefined();
  });

  it.each([
    ['auto', 'Theo máy'],
    ['dark', 'Tối'],
    ['clay-dark', 'Tối'], // retired Clay id
    ['glass-light', 'Sáng'], // retired Glass id
  ])('shows the stored preference %s as %s', async (stored, mode) => {
    localStorage.setItem('qhhoj.theme', stored);
    mockApi({ 'GET /auth/me': signedOut });
    const { wrapper } = await mountApp('/settings/appearance');
    const pressed = wrapper
      .findAll('[role="group"][aria-label="Chế độ"] button[aria-pressed="true"]')
      .map((button) => button.text());
    expect(pressed).toEqual([mode]);
  });

  it('resets the look and the mode to the site default', async () => {
    const calls = mockApi({ 'GET /auth/me': signedIn(), ...echoProfile });
    const { wrapper } = await mountApp('/settings/appearance');
    await wrapper.get('button[aria-label="Đất nung"]').trigger('click');
    const reset = wrapper
      .findAll('button')
      .find((button) => button.text() === 'Về mặc định của trang')!;
    await reset.trigger('click');
    await flushPromises();
    expect(patches(calls).at(-1)).toEqual({ appearance: null, siteTheme: 'auto' });
    expect(root.dataset.accent).toBeUndefined();
  });

  it("shows the account's saved look when the page opens", async () => {
    mockApi({
      'GET /auth/me': signedIn(),
      'GET /profile': ok(profile({ appearance: { accent: 'plum', contrast: 'high' } })),
    });
    const { wrapper } = await mountApp('/settings/appearance');
    expect(wrapper.get('button[aria-label="Mận"]').attributes('aria-pressed')).toBe('true');
    expect(choiceIn(wrapper, 'Độ tương phản', 'Cao').attributes('aria-pressed')).toBe('true');
  });
});

describe('Settings › Appearance › Bit chạy quanh trang', () => {
  const card = (wrapper: VueWrapper) => wrapper.get('[data-testid="bit-roam-section"]');

  it('is off with one Bit by default, the count greyed until it is on', async () => {
    mockApi({ 'GET /auth/me': signedIn(), ...echoProfile });
    const { wrapper } = await mountApp('/settings/appearance');
    expect(card(wrapper).get('[role="switch"]').attributes('aria-checked')).toBe('false');
    const count = card(wrapper).get<HTMLInputElement>('#bit-roam-count');
    expect(count.element.value).toBe('1');
    expect(count.attributes('disabled')).toBeDefined();
    expect(count.attributes('aria-describedby')).toBe('bit-roam-count-hint');
    expect(card(wrapper).text()).toContain('Tối đa 5; điện thoại tối đa 3.');
  });

  it('saves the switch at once and the count when the slider is released', async () => {
    const calls = mockApi({
      'GET /auth/me': signedIn(),
      'GET /contests/current': ok(null),
      ...echoProfile,
    });
    const { wrapper } = await mountApp('/settings/appearance');
    await card(wrapper).get('[role="switch"]').trigger('click');
    await flushPromises();
    expect(patches(calls)).toEqual([{ bitRoam: { on: true, count: 1 } }]);
    const count = card(wrapper).get<HTMLInputElement>('#bit-roam-count');
    count.element.value = '4';
    await count.trigger('input');
    expect(patches(calls)).toHaveLength(1);
    await count.trigger('change');
    await flushPromises();
    expect(patches(calls).at(-1)).toEqual({ bitRoam: { on: true, count: 4 } });
    // Off keeps the count.
    await card(wrapper).get('[role="switch"]').trigger('click');
    await flushPromises();
    expect(patches(calls).at(-1)).toEqual({ bitRoam: { on: false, count: 4 } });
  });

  it('keeps a visitor’s choice in this browser and sends nothing', async () => {
    const calls = mockApi({ 'GET /auth/me': signedOut });
    const { wrapper } = await mountApp('/settings/appearance');
    await card(wrapper).get('[role="switch"]').trigger('click');
    expect(JSON.parse(localStorage.getItem('qhhoj.bitRoam')!)).toEqual({ on: true, count: 1 });
    expect(card(wrapper).get('p[role="status"]').text()).toContain('trình duyệt này');
    expect(patches(calls)).toEqual([]);
    sessionStorage.clear();
  });
});
