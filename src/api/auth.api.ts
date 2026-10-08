import { apiRequest } from './client';
import type {
  ChangePasswordBody,
  LoginBody,
  PasskeyRequestOptions,
  PasswordResetBody,
  RegisterBody,
  SessionResponse,
  SocialCompleteBody,
  SocialProvidersResponse,
  UsernameAvailableResponse,
} from './types/auth';

export const fetchSession = () => apiRequest<SessionResponse>('/auth/me');
export const login = (body: LoginBody) =>
  apiRequest<SessionResponse>('/auth/login', { method: 'POST', body });
export const logout = () => apiRequest<void>('/auth/logout', { method: 'POST' });
/** Ends every session of the account, this one included; the server clears the cookie. The backend allows it while impersonating; the UI locks it then (Decision 16). */
export const logoutAllSessions = () => apiRequest<void>('/auth/logout-all', { method: 'POST' });
/** Back to the staff account that started viewing as this user. */
export const stopImpersonation = () =>
  apiRequest<SessionResponse>('/auth/impersonate/stop', { method: 'POST' });
export const register = (body: RegisterBody) =>
  apiRequest<void>('/auth/register', { method: 'POST', body });
export const activate = (token: string) =>
  apiRequest<void>('/auth/activate', { method: 'POST', body: { token } });
/** 204 whatever the email: nothing says whether the address has an account. */
export const resendActivation = (email: string) =>
  apiRequest<void>('/auth/activate/resend', { method: 'POST', body: { email } });
export const fetchUsernameAvailable = (username: string, signal?: AbortSignal) =>
  apiRequest<UsernameAvailableResponse>('/auth/username-available', {
    query: { username },
    signal,
  });

/** A TOTP code or a scratch code; the backend tells them apart. */
export const verifyTotp = (code: string) =>
  apiRequest<void>('/auth/2fa/totp/verify', { method: 'POST', body: { code } });
/** `null` when the session no longer needs a second factor. */
export const webauthnLoginOptions = () =>
  apiRequest<PasskeyRequestOptions | null>('/auth/2fa/webauthn/login/options', { method: 'POST' });
export const webauthnLoginVerify = (response: object) =>
  apiRequest<void>('/auth/2fa/webauthn/login/verify', { method: 'POST', body: { response } });

export const requestPasswordReset = (email: string) =>
  apiRequest<void>('/auth/password/reset', { method: 'POST', body: { email } });
export const confirmPasswordReset = (body: PasswordResetBody) =>
  apiRequest<void>('/auth/password/reset/confirm', { method: 'POST', body });
export const changePassword = (body: ChangePasswordBody) =>
  apiRequest<void>('/auth/password/change', { method: 'POST', body });
export const completeSocialSignup = (body: SocialCompleteBody) =>
  apiRequest<SessionResponse>('/auth/social/complete', { method: 'POST', body });
export const fetchSocialProviders = () =>
  apiRequest<SocialProvidersResponse>('/auth/social/providers');
