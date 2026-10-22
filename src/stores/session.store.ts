import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import {
  completeSocialSignup as completeSocialSignupRequest,
  fetchSession,
  login as loginRequest,
  logout as logoutRequest,
  logoutAllSessions,
  startImpersonation,
  stopImpersonation,
} from '@/api/auth.api';
import { ApiError, onCsrfFailed, onUnauthorized, setCsrfToken } from '@/api/client';
import type {
  LoginBody,
  SessionResponse,
  SessionUser,
  SocialCompleteBody,
  TwoFactorPending,
} from '@/api/types/auth';

export type SessionStatus = 'unknown' | 'anonymous' | 'partial' | 'authenticated';

const statusOf = (session: SessionResponse | null): SessionStatus => {
  if (!session) return 'anonymous';
  return session.twoFactorRequired ? 'partial' : 'authenticated';
};

/** What a session response (or none: signed out) sets in the store; absent members reset to their empty value. */
const sessionFields = (session: SessionResponse | null) => {
  const source: Partial<SessionResponse> = session ?? {};
  return {
    user: source.user ?? null,
    passwordChangeRequired: source.passwordChangeRequired ?? false,
    impersonatorId: source.impersonatorId ?? null,
    twoFactor: source.twoFactor ?? null,
    csrfToken: source.csrfToken ?? null,
    status: statusOf(session),
  };
};

export const useSessionStore = defineStore('session', () => {
  const status = ref<SessionStatus>('unknown');
  const user = ref<SessionUser | null>(null);
  const passwordChangeRequired = ref(false);
  const impersonatorId = ref<string | null>(null);
  /** While the second factor is pending: the account name and the factors it can use. */
  const twoFactor = ref<TwoFactorPending | null>(null);
  const isStaff = computed(() => user.value?.isStaff ?? false);
  let loading: Promise<void> | null = null;
  /** The sign-out request still in flight: a later login or reload waits for it, so it cannot end the new session. */
  let signingOut: Promise<void> = Promise.resolve();

  function apply(session: SessionResponse | null) {
    const fields = sessionFields(session);
    user.value = fields.user;
    passwordChangeRequired.value = fields.passwordChangeRequired;
    impersonatorId.value = fields.impersonatorId;
    twoFactor.value = fields.twoFactor;
    setCsrfToken(fields.csrfToken);
    status.value = fields.status;
  }

  /** 401 means signed out; any other failure leaves the status unknown and is rethrown. */
  async function loadSession() {
    try {
      apply(await fetchSession());
    } catch (error) {
      if (!(error instanceof ApiError && error.code === 'unauthorized')) throw error;
      apply(null);
    }
  }

  /** Waits for a sign-out in flight, so the reload cannot bring back the session it is ending. */
  async function refresh() {
    await signingOut;
    await loadSession();
  }

  /** The first caller loads `/auth/me`; concurrent callers share it; later callers return at once. */
  function ensureLoaded(): Promise<void> {
    if (status.value !== 'unknown') return Promise.resolve();
    loading ??= refresh().finally(() => (loading = null));
    return loading;
  }

  const login = async (body: LoginBody) => {
    await signingOut;
    apply(await loginRequest(body));
  };

  /** Finishing a social signup opens the session like a password login does. */
  const completeSocialSignup = async (body: SocialCompleteBody) => {
    await signingOut;
    apply(await completeSocialSignupRequest(body));
  };

  /** Ends the session here at once, without waiting for the server (it may be unreachable, and the viewer need not wait for it). */
  function logout() {
    signingOut = endServerSession();
    apply(null);
    return Promise.resolve();
  }

  /** Never rejects. A stale token (another tab signed in again) is reloaded and the sign-out sent once more: ending this browser's session is what the viewer asked for. */
  async function endServerSession() {
    try {
      await logoutRequest();
    } catch (error) {
      if (error instanceof ApiError && error.code === 'csrf_failed')
        await resendLogoutWithFreshToken().catch(() => undefined);
    }
  }

  /** Takes only the token of the session the cookie now holds, so this signed-out tab never shows it. */
  async function resendLogoutWithFreshToken() {
    setCsrfToken((await fetchSession())?.csrfToken ?? null);
    try {
      await logoutRequest();
    } finally {
      setCsrfToken(null);
    }
  }

  /** The server ended this viewer's session and this tab could not learn it: the guest state, with no request. */
  const forgetSession = () => apply(null);

  /** Every session of the account ends, this one included (the server clears the cookie). Rethrows, so the page can say it failed. */
  async function logoutEverywhere() {
    await logoutAllSessions();
    apply(null);
  }

  /** Back to the staff account that started viewing as this user. */
  const stopImpersonating = async () => apply(await stopImpersonation());

  /** Superuser: view the site as another account; the cache of the staff account is dropped by `useAccountCacheSync` when the user changes. Rethrows, so the caller can say why it was refused. */
  const startImpersonating = async (userId: string) => apply(await startImpersonation(userId));

  /**
   * A write refused with `csrf_failed`: reload the session, and allow the resend only when it still belongs to the account that sent the
   * write (another tab may have signed in as someone else). A signed-out tab has no one to resend as, and its sign-out retries itself.
   */
  async function reloadForResend(): Promise<boolean> {
    const senderId = user.value?.id ?? null;
    if (senderId === null) return false;
    await loadSession();
    return user.value?.id === senderId;
  }

  onCsrfFailed(reloadForResend);
  /** A protected request answered 401: the session expired, so the viewer is signed out here (guards redirect on the next navigation). */
  onUnauthorized(() => apply(null));

  return {
    status,
    user,
    passwordChangeRequired,
    impersonatorId,
    twoFactor,
    isStaff,
    ensureLoaded,
    refresh,
    forgetSession,
    login,
    completeSocialSignup,
    logout,
    logoutEverywhere,
    stopImpersonating,
    startImpersonating,
  };
});
