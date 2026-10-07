import type { SessionResponse, SessionUser } from '../api/types/auth';
import type { Profile } from '../api/types/profile';

export const sessionUser = (overrides: Partial<SessionUser> = {}): SessionUser => ({
  id: '0192a000-0000-7000-8000-000000000001',
  username: 'user_01',
  email: 'user01@example.com',
  isStaff: false,
  isSuperuser: false,
  permissions: [],
  isTotpEnabled: false,
  isWebauthnEnabled: false,
  ...overrides,
});

export const sessionResponse = (overrides: Partial<SessionResponse> = {}): SessionResponse => ({
  user: sessionUser(),
  csrfToken: 'csrf-1',
  twoFactorRequired: false,
  passwordChangeRequired: false,
  impersonatorId: null,
  ...overrides,
});

/** `GET /auth/me` answers for a signed-in and a signed-out viewer. */
export const signedIn = (overrides: Partial<SessionResponse> = {}) => ({
  body: { data: sessionResponse(overrides) },
});
export const signedOut = {
  status: 401,
  body: { error: { code: 'unauthorized', message: 'Unauthorized' } },
};

export const profile = (overrides: Partial<Profile> = {}): Profile => ({
  firstName: '',
  timezone: 'Asia/Ho_Chi_Minh',
  languageId: '0192a000-0000-7000-8000-00000000c017',
  aceTheme: 'auto',
  siteTheme: 'auto',
  mathEngine: 'auto',
  ...overrides,
});
