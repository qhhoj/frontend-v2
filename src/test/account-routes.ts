import type { SessionResponse } from '@/api/types/auth';
import type { Profile } from '@/api/types/profile';
import { problemMeta, profile, signedIn } from './fixtures';
import { ok } from './mock-api';
import type { MockHandler } from './mock-api';

/** What every settings page asks for: the session, the profile (theme sync and the profile form), the languages (profile defaults), the backup-code count and the key list (security page; both answer a 403 under impersonation, so those specs override or never mount them). */
export const settingsRoutes = (
  session: Partial<SessionResponse> = {},
  profileOverrides: Partial<Profile> = {},
): Record<string, MockHandler> => ({
  'GET /auth/me': signedIn(session),
  'GET /profile': ok(profile(profileOverrides)),
  'GET /problems/meta': ok(problemMeta()),
  'GET /auth/2fa/totp/scratch-codes': ok({ remaining: 5 }),
  'GET /auth/2fa/webauthn/credentials': ok([]),
  'GET /auth/social/links': ok({ providers: [] }),
});
