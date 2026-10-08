import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import {
  completeSocialSignup as completeSocialSignupRequest,
  fetchSession,
  login as loginRequest,
  logout as logoutRequest,
  logoutAllSessions,
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

export const useSessionStore = defineStore('session', () => {
  const status = ref<SessionStatus>('unknown');
  const user = ref<SessionUser | null>(null);
  const passwordChangeRequired = ref(false);
  const impersonatorId = ref<string | null>(null);
  /** While the second factor is pending: the account name and the factors it can use. */
  const twoFactor = ref<TwoFactorPending | null>(null);
  const isStaff = computed(() => user.value?.isStaff ?? false);
  let loading: Promise<void> | null = null;

  function apply(session: SessionResponse | null) {
    user.value = session?.user ?? null;
    passwordChangeRequired.value = session?.passwordChangeRequired ?? false;
    impersonatorId.value = session?.impersonatorId ?? null;
    twoFactor.value = session?.twoFactor ?? null;
    setCsrfToken(session?.csrfToken ?? null);
    status.value = !session ? 'anonymous' : session.twoFactorRequired ? 'partial' : 'authenticated';
  }

  /** 401 means signed out; any other failure leaves the status unknown and is rethrown. */
  async function refresh() {
    try {
      apply(await fetchSession());
    } catch (error) {
      if (!(error instanceof ApiError && error.code === 'unauthorized')) throw error;
      apply(null);
    }
  }

  /** The first caller loads `/auth/me`; concurrent callers share it; later callers return at once. */
  function ensureLoaded(): Promise<void> {
    if (status.value !== 'unknown') return Promise.resolve();
    loading ??= refresh().finally(() => (loading = null));
    return loading;
  }

  const login = async (body: LoginBody) => apply(await loginRequest(body));

  /** Finishing a social signup opens the session like a password login does. */
  const completeSocialSignup = async (body: SocialCompleteBody) =>
    apply(await completeSocialSignupRequest(body));

  /** Ends the session here even if the server cannot be told. */
  async function logout() {
    await logoutRequest().catch(() => undefined);
    apply(null);
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

  onCsrfFailed(refresh);
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
  };
});
