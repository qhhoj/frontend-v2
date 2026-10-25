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
import { openSessionChannel } from './session-channel';
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
  /** Counts the times the session ended or changed without the viewer asking (expired, or another tab signed out or in as someone else): the router re-runs its guards on each. */
  const sessionLostCount = ref(0);
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

  /**
   * A change this tab made (sign-in, sign-out, impersonation, a reload): the other tabs hear the new account, if it is
   * another one. A session waiting for its second factor is not announced: the other tabs meet that gate themselves.
   */
  function applyOwn(session: SessionResponse | null) {
    const previousId = user.value?.id ?? null;
    apply(session);
    const userId = user.value?.id ?? null;
    if (userId !== previousId && status.value !== 'partial') channel.announce(userId);
  }

  /** 401 means signed out; any other failure leaves the status unknown and is rethrown. */
  async function loadSession(applySession: typeof apply = apply) {
    try {
      applySession(await fetchSession());
    } catch (error) {
      if (!(error instanceof ApiError && error.code === 'unauthorized')) throw error;
      applySession(null);
    }
  }

  /** Waits for a sign-out in flight, so the reload cannot bring back the session it is ending. */
  async function reload(applySession: typeof apply = apply) {
    await signingOut;
    await loadSession(applySession);
  }

  /** Reloads after a change the server made for this tab (second factor, password, security keys), and tells the other tabs. */
  const refresh = () => reload(applyOwn);

  /** The first caller loads `/auth/me`; concurrent callers share it; later callers return at once. Nothing changed, so nothing is announced. */
  function ensureLoaded(): Promise<void> {
    if (status.value !== 'unknown') return Promise.resolve();
    loading ??= reload().finally(() => (loading = null));
    return loading;
  }

  const login = async (body: LoginBody) => {
    await signingOut;
    applyOwn(await loginRequest(body));
  };

  /** Finishing a social signup opens the session like a password login does. */
  const completeSocialSignup = async (body: SocialCompleteBody) => {
    await signingOut;
    applyOwn(await completeSocialSignupRequest(body));
  };

  /** The sign-out in flight, shared by a second click; while set, a `csrf_failed` on it is resent by `endServerSession`, never by the client's reload. */
  let ending: Promise<void> | null = null;

  /**
   * Shows the guest state only once the server ended the session. A failed request (network, 5xx) leaves the viewer signed in,
   * since the cookie still works, and rejects so the caller can say so and offer a retry. `unauthorized` means it had ended.
   */
  async function logout() {
    ending ??= endServerSession()
      .catch((error: unknown) => {
        if (!(error instanceof ApiError && error.code === 'unauthorized')) throw error;
      })
      .finally(() => (ending = null));
    signingOut = ending.catch(() => undefined);
    await ending;
    applyOwn(null);
  }

  /** A stale token (another tab signed in again) is reloaded and the sign-out sent once more: ending this browser's session is what the viewer asked for. */
  async function endServerSession() {
    try {
      await logoutRequest();
    } catch (error) {
      if (!(error instanceof ApiError && error.code === 'csrf_failed')) throw error;
      await resendLogoutWithFreshToken();
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
    applyOwn(null);
  }

  /** Back to the staff account that started viewing as this user. */
  const stopImpersonating = async () => applyOwn(await stopImpersonation());

  /** Superuser: view the site as another account; the cache of the staff account is dropped by `useAccountCacheSync` when the user changes. Rethrows, so the caller can say why it was refused. */
  const startImpersonating = async (userId: string) => applyOwn(await startImpersonation(userId));

  /**
   * A write refused with `csrf_failed`: reload the session, and allow the resend only when it still belongs to the account that sent the
   * write (another tab may have signed in as someone else). A signed-out tab has no one to resend as, and a sign-out retries itself.
   */
  async function reloadForResend(): Promise<boolean> {
    const senderId = user.value?.id ?? null;
    if (senderId === null || ending) return false;
    await loadSession();
    return user.value?.id === senderId;
  }

  /** Signed out without the viewer asking: forget the session here and let the router move the viewer off a page that needs it. */
  function loseSession() {
    if (status.value !== 'authenticated' && status.value !== 'partial') return;
    apply(null);
    sessionLostCount.value += 1;
  }

  /**
   * Another tab announced its account. Signed out: the cookie is gone, so forget the session at once, with no request.
   * Another account: re-read who the cookie now belongs to (the answer, not the message, is the truth) and let the
   * router re-check the page. Not re-announced, so two tabs never echo an old change back at each other.
   */
  function followOtherTab(userId: string | null) {
    // First: a tab waiting for its second factor has no user either, and must still drop the session.
    if (userId === null) return loseSession();
    if (userId === user.value?.id) return;
    void rereadForOtherTab();
  }

  async function rereadForOtherTab() {
    const previousId = user.value?.id ?? null;
    await reload().catch(() => undefined); // offline: the next request tells
    if ((user.value?.id ?? null) !== previousId) sessionLostCount.value += 1;
  }

  const channel = openSessionChannel(followOtherTab);
  onCsrfFailed(reloadForResend);
  /** A protected request answered 401: the session expired. */
  onUnauthorized(loseSession);

  return {
    status,
    user,
    passwordChangeRequired,
    impersonatorId,
    twoFactor,
    isStaff,
    sessionLostCount,
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
