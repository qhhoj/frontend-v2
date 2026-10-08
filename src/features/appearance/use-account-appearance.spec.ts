import { flushPromises } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { useSessionStore } from '@/stores/session.store';
import { profile, signedIn, signedOut } from '@/test/fixtures';
import { mockApi, ok } from '@/test/mock-api';
import { mountApp } from '@/test/mount';

const OCEAN = { accent: 'ocean', glass: 40, glow: 60 };
const MINT = { accent: 'mint', glass: 10, glow: 20 };
const root = document.documentElement;
const failedProfile = { status: 500, body: { error: { code: 'internal_error', message: 'x' } } };

describe('account appearance sync', () => {
  it("paints the account's look once the profile is loaded", async () => {
    mockApi({ 'GET /auth/me': signedIn(), 'GET /profile': ok(profile({ appearance: OCEAN })) });
    await mountApp('/blog');
    expect(root.dataset.accent).toBe('ocean');
    expect(root.style.getPropertyValue('--qh-glass-level')).toBe('40');
    expect(root.style.getPropertyValue('--qh-blob-strength')).toBe('0.6');
  });

  it("lets the account outrank this browser, and null mean the site's own look", async () => {
    localStorage.setItem('qhhoj.appearance', JSON.stringify(MINT));
    localStorage.setItem('qhhoj.paintedAppearance', JSON.stringify(MINT));
    mockApi({ 'GET /auth/me': signedIn(), 'GET /profile': ok(profile({ appearance: null })) });
    await mountApp('/blog');
    expect(root.dataset.accent).toBeUndefined();
  });

  it('keeps the pre-painted look while the profile fails to load', async () => {
    localStorage.setItem('qhhoj.paintedAppearance', JSON.stringify(OCEAN));
    mockApi({ 'GET /auth/me': signedIn(), 'GET /profile': failedProfile });
    await mountApp('/blog');
    expect(root.dataset.accent).toBe('ocean');
  });

  it('reads an invalid account value as the site look', async () => {
    mockApi({
      'GET /auth/me': signedIn(),
      'GET /profile': ok(profile({ appearance: { accent: 'violet', glass: 1, glow: 1 } })),
    });
    await mountApp('/blog');
    expect(root.dataset.accent).toBeUndefined();
  });

  it("uses this browser's look for an anonymous visitor", async () => {
    localStorage.setItem('qhhoj.appearance', JSON.stringify(MINT));
    mockApi({ 'GET /auth/me': signedOut });
    await mountApp('/blog');
    expect(root.dataset.accent).toBe('mint');
  });

  it("uses this browser's look while a password change blocks the profile, not the painted account look", async () => {
    localStorage.setItem('qhhoj.appearance', JSON.stringify(MINT));
    localStorage.setItem('qhhoj.paintedAppearance', JSON.stringify(OCEAN));
    mockApi({ 'GET /auth/me': signedIn({ passwordChangeRequired: true }) });
    await mountApp('/blog');
    expect(root.dataset.accent).toBe('mint');
  });

  it("hands back to this browser's look on sign-out", async () => {
    localStorage.setItem('qhhoj.appearance', JSON.stringify(MINT));
    mockApi({ 'GET /auth/me': signedIn(), 'GET /profile': ok(profile({ appearance: OCEAN })) });
    await mountApp('/blog');
    expect(root.dataset.accent).toBe('ocean');
    useSessionStore().$patch({ status: 'anonymous', user: null }); // what a 401 on any request does
    await flushPromises();
    expect(root.dataset.accent).toBe('mint');
  });
});
