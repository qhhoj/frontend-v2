import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { fetchSession, login as loginRequest, logout as logoutRequest } from '@/api/auth.api';
import { ApiError, onCsrfFailed, onUnauthorized, setCsrfToken } from '@/api/client';
import type { LoginBody, SessionResponse, SessionUser } from '@/api/types/auth';

export type SessionStatus = 'unknown' | 'anonymous' | 'partial' | 'authenticated';

export const useSessionStore = defineStore('session', () => {
  const status = ref<SessionStatus>('unknown');
  const user = ref<SessionUser | null>(null);
  const passwordChangeRequired = ref(false);
  const impersonatorId = ref<string | null>(null);
  const isStaff = computed(() => user.value?.isStaff ?? false);
  let loading: Promise<void> | null = null;

  function apply(session: SessionResponse | null) {
    user.value = session?.user ?? null;
    passwordChangeRequired.value = session?.passwordChangeRequired ?? false;
    impersonatorId.value = session?.impersonatorId ?? null;
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

  /** Ends the session here even if the server cannot be told. */
  async function logout() {
    await logoutRequest().catch(() => undefined);
    apply(null);
  }

  onCsrfFailed(refresh);
  /** A protected request answered 401: the session expired, so the viewer is signed out here (guards redirect on the next navigation). */
  onUnauthorized(() => apply(null));

  return {
    status,
    user,
    passwordChangeRequired,
    impersonatorId,
    isStaff,
    ensureLoaded,
    refresh,
    login,
    logout,
  };
});
