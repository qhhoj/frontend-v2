import { describe, expect, it } from 'vitest';
import { canEnterAdmin, canUseAdmin } from './admin-access';
import type { AdminViewer } from './admin-access';
import { ADMIN_SCREENS } from './admin-screens';

const viewer = (overrides: Partial<AdminViewer> = {}): AdminViewer => ({
  isStaff: false,
  isSuperuser: false,
  permissions: [],
  adminCapabilities: { organizations: false },
  ...overrides,
});

describe('canEnterAdmin', () => {
  it.each([
    ['a problem author with edit_own_problem', viewer({ permissions: ['judge.edit_own_problem'] })],
    ['a creator with add_contest', viewer({ permissions: ['judge.add_contest'] })],
    ['a suggester', viewer({ permissions: ['judge.suggest_new_problem'] })],
    ['an organization admin', viewer({ adminCapabilities: { organizations: true } })],
    [
      'a moderator who may only reject submissions',
      viewer({ permissions: ['judge.reject_submission'] }),
    ],
    ['a superuser without the staff flag', viewer({ isSuperuser: true })],
    ['staff without any permission', viewer({ isStaff: true })],
  ])('lets in %s', (_who, user) => expect(canEnterAdmin(user)).toBe(true));

  it.each([
    ['a signed-out visitor', null],
    ['a user without rights', viewer()],
    [
      'a user holding only a permission no admin screen uses',
      viewer({ permissions: ['judge.spam_organization'] }),
    ],
    ['a session from a backend without capabilities', viewer({ adminCapabilities: undefined })],
  ])('keeps out %s', (_who, user) => expect(canEnterAdmin(user)).toBe(false));
});

describe('canUseAdmin', () => {
  const organizations = ADMIN_SCREENS.organizations;

  it('opens the organizations screen to an organization admin, without the permission', () => {
    expect(canUseAdmin(viewer({ adminCapabilities: { organizations: true } }), organizations)).toBe(
      true,
    );
    expect(canUseAdmin(viewer(), organizations)).toBe(false);
  });

  it('keeps permission-only screens closed to an organization admin', () => {
    const organizationAdmin = viewer({ adminCapabilities: { organizations: true } });
    expect(canUseAdmin(organizationAdmin, ADMIN_SCREENS.organizationQuotas)).toBe(false);
    expect(canUseAdmin(organizationAdmin, ADMIN_SCREENS.problemGeneral)).toBe(false);
    expect(canUseAdmin(organizationAdmin, ADMIN_SCREENS.settings)).toBe(false);
  });

  it('opens a problem editor tab only with edit_own_problem, as the backend requires', () => {
    expect(
      canUseAdmin(viewer({ permissions: ['judge.edit_own_problem'] }), ADMIN_SCREENS.problemData),
    ).toBe(true);
    expect(
      canUseAdmin(viewer({ permissions: ['judge.add_problem'] }), ADMIN_SCREENS.problemData),
    ).toBe(false);
  });
});
