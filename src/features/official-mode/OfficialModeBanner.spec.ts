import { describe, expect, it } from 'vitest';
import { sessionUser, signedIn } from '@/test/fixtures';
import { fail, mockApi, ok } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { anonymousViewer, signedInViewer } from '@/test/problem-routes';

const START = '/blog/new';
const site = (officialMode: boolean) => ({
  'GET /site': ok({ navigation: [], config: {}, officialMode }),
});
/** `signedInViewer` with a superuser session; its `GET /profile` stays. */
const superuserViewer = () => ({
  ...signedInViewer(),
  'GET /auth/me': signedIn({ user: sessionUser({ isSuperuser: true, isStaff: true }) }),
});
const officialBanner = () =>
  document.body.querySelector<HTMLElement>('[data-testid="official-banner"]');
const pill = () => document.body.querySelector<HTMLElement>('[data-testid="official-pill"]');

describe('official mode in the shell', () => {
  it('shows the pill beside the logo and the banner with what is locked', async () => {
    mockApi({ ...signedInViewer(), ...site(true) });
    await mountApp(START);
    expect(pill()!.textContent).toContain('Thi chính thức');
    expect(officialBanner()!.textContent).toContain('Chế độ thi chính thức đang bật.');
    expect(officialBanner()!.textContent).toContain('phiếu hỗ trợ vẫn dùng được');
    expect(officialBanner()!.textContent).not.toContain('quản trị viên tối cao');
  });

  it('sits in a polite status region that exists before the mode is on', async () => {
    mockApi({ ...signedInViewer(), ...site(false) });
    await mountApp(START);
    expect(document.body.querySelector('header + [role="status"]')?.textContent).toBe('');
    mockApi({ ...signedInViewer(), ...site(true) });
    await mountApp(START);
    expect(officialBanner()!.parentElement!.getAttribute('role')).toBe('status');
  });

  it('tells a superuser they are exempt', async () => {
    mockApi({ ...superuserViewer(), ...site(true) });
    await mountApp(START);
    expect(officialBanner()!.textContent).toContain('quản trị viên tối cao');
  });

  it('shows nothing while the mode is off', async () => {
    mockApi({ ...signedInViewer(), ...site(false) });
    await mountApp(START);
    expect(pill()).toBeNull();
    expect(officialBanner()).toBeNull();
  });

  it('trusts officialMode false over an end time that is still in the future', async () => {
    mockApi({
      ...signedInViewer(),
      'GET /site': ok({
        navigation: [],
        config: {},
        officialMode: false,
        officialModeEndsAt: '2099-01-01T00:00:00Z',
      }),
    });
    await mountApp(START);
    expect(pill()).toBeNull();
    expect(officialBanner()).toBeNull();
  });

  it('asks nothing for an anonymous viewer', async () => {
    const calls = mockApi({
      ...anonymousViewer,
      'GET /pages/no-such-page': fail(404, 'not_found'),
      ...site(true),
    });
    await mountApp('/no-such-page');
    expect(calls.some((call) => call.path === '/site')).toBe(false);
    expect(officialBanner()).toBeNull();
  });
});
