import { Buffer } from 'node:buffer';
import type { SecondFactorMethod } from '../../src/api/types/auth';
import type { FieldIssue } from '../../src/api/client';
import { partialSession, sessionResponse } from '../../src/test/fixtures';
import type { FakeApi, Handler, Reply } from './api';

/** What `/auth/me` answers: nobody, a pending second factor, a viewer who must change a breached password, or a full session. */
export type AuthPhase = 'anonymous' | 'partial' | 'forced' | 'authenticated';
export interface AuthScenario {
  phase: AuthPhase;
  /** Where a successful password sign-in puts the session. */
  afterLogin: AuthPhase;
  /** The second factors the pending account has. */
  methods: SecondFactorMethod[];
  /** Every auth request that changed something, by name, with its body. */
  readonly sent: { key: string; body: unknown }[];
}

export const PASSKEY_CREDENTIAL_ID = Buffer.from('qhhoj-test-credential');
const ok = (data: unknown): Reply => ({ body: { data } });
const noContent = (): Reply => ({ status: 204 });
export const fail = (status: number, code: string, extra: Record<string, unknown> = {}): Reply => ({
  status,
  body: { error: { code, message: code, ...extra } },
});
/** A `validation_failed` shaped like the backend's: `issues`, and `fields` built from their messages. */
export function invalid(...issues: FieldIssue[]): Reply {
  const fields: Record<string, string[]> = {};
  for (const { field, message } of issues) (fields[field] ??= []).push(message);
  return fail(400, 'validation_failed', { fields, issues });
}

const sessionFor = (phase: AuthPhase, methods: SecondFactorMethod[]): Reply =>
  ({
    anonymous: fail(401, 'unauthorized'),
    partial: ok(partialSession(methods)),
    forced: ok(sessionResponse({ passwordChangeRequired: true })),
    authenticated: ok(sessionResponse()),
  })[phase];

/** The options a real backend would issue: discoverable by id, so the browser's authenticator can answer. */
const passkeyOptions = () => ({
  challenge: 'Y2hhbGxlbmdl',
  rpId: 'localhost',
  timeout: 60_000,
  userVerification: 'preferred',
  allowCredentials: [{ type: 'public-key', id: PASSKEY_CREDENTIAL_ID.toString('base64url') }],
});

/** Password `wrong`, code `000000` and username `taken_name` fail like the backend does. */
function authRoutes(scenario: AuthScenario): Record<string, Handler> {
  const recorded =
    (key: string, handler: (body: unknown) => Reply): Handler =>
    ({ body }) => {
      scenario.sent.push({ key, body });
      return handler(body);
    };
  const move = (phase: AuthPhase, reply: Reply): Reply => {
    scenario.phase = phase;
    return reply;
  };
  const session = (phase: AuthPhase) => sessionFor(phase, scenario.methods);
  return {
    'GET /auth/me': () => session(scenario.phase),
    'POST /auth/login': recorded('login', (body) =>
      (body as { password: string }).password === 'wrong'
        ? fail(401, 'invalid_credentials')
        : move(scenario.afterLogin, session(scenario.afterLogin)),
    ),
    'POST /auth/logout': recorded('logout', () => move('anonymous', noContent())),
    'POST /auth/2fa/totp/verify': recorded('totp', (body) =>
      (body as { code: string }).code === '000000'
        ? fail(400, 'invalid_code')
        : move('authenticated', noContent()),
    ),
    'POST /auth/2fa/webauthn/login/options': ok(passkeyOptions()),
    'POST /auth/2fa/webauthn/login/verify': recorded('webauthn-verify', () =>
      move('authenticated', noContent()),
    ),
    'POST /auth/register': recorded('register', (body) =>
      (body as { username: string }).username === 'taken_name'
        ? invalid({ field: 'username', code: 'username_taken', message: 'Username is taken.' })
        : noContent(),
    ),
    'POST /auth/activate': recorded('activate', () => noContent()),
    'POST /auth/activate/resend': recorded('resend', () => noContent()),
    'POST /auth/password/reset': recorded('forgot', () => noContent()),
    'POST /auth/password/reset/confirm': recorded('reset', () => move('anonymous', noContent())),
    'POST /auth/password/change': recorded('change', () => move('authenticated', noContent())),
    'POST /auth/social/complete': recorded('social-complete', () =>
      move('authenticated', session('authenticated')),
    ),
  };
}

/** Adds the auth endpoints to the fake API. */
export function installAuth(
  api: FakeApi,
  initial: Partial<Pick<AuthScenario, 'phase' | 'afterLogin' | 'methods'>> = {},
): AuthScenario {
  const scenario: AuthScenario = {
    phase: 'anonymous',
    afterLogin: 'authenticated',
    methods: ['totp', 'webauthn'],
    sent: [],
    ...initial,
  };
  Object.assign(api.routes, authRoutes(scenario));
  return scenario;
}
