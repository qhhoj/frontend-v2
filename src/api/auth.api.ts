import { apiGet, apiSend } from './typed';
import type {
  ChangePasswordBody,
  LoginBody,
  PasswordResetBody,
  RegisterBody,
  SocialCompleteBody,
} from './types/auth';

export const fetchSession = () => apiGet('/auth/me');
export const login = (body: LoginBody) => apiSend('post', '/auth/login', { body });
export const logout = () => apiSend('post', '/auth/logout');
/** Ends every session of the account, this one included; the server clears the cookie. The backend refuses it while impersonating (`@NoImpersonation()`); the UI also locks it then (Decision 16). */
export const logoutAllSessions = () => apiSend('post', '/auth/logout-all');
/** Superuser only (backend U2); the answer is the new session and the response sets its cookie. 403 for a superuser target or while already impersonating. */
export const startImpersonation = (userId: string) =>
  apiSend('post', '/auth/impersonate/{userId}', { path: { userId } });
/** Back to the staff account that started viewing as this user. */
export const stopImpersonation = () => apiSend('post', '/auth/impersonate/stop');
export const register = (body: RegisterBody) => apiSend('post', '/auth/register', { body });
export const activate = (token: string) => apiSend('post', '/auth/activate', { body: { token } });
/** 204 whatever the email: nothing says whether the address has an account. */
export const resendActivation = (email: string) =>
  apiSend('post', '/auth/activate/resend', { body: { email } });
export const fetchUsernameAvailable = (username: string, signal?: AbortSignal) =>
  apiGet('/auth/username-available', { query: { username }, signal });

/** A TOTP code or a scratch code; the backend tells them apart. */
export const verifyTotp = (code: string) =>
  apiSend('post', '/auth/2fa/totp/verify', { body: { code } });
/** `null` when the session no longer needs a second factor. */
export const webauthnLoginOptions = () => apiSend('post', '/auth/2fa/webauthn/login/options');
export const webauthnLoginVerify = (response: Record<string, unknown>) =>
  apiSend('post', '/auth/2fa/webauthn/login/verify', { body: { response } });

export const requestPasswordReset = (email: string) =>
  apiSend('post', '/auth/password/reset', { body: { email } });
export const confirmPasswordReset = (body: PasswordResetBody) =>
  apiSend('post', '/auth/password/reset/confirm', { body });
export const changePassword = (body: ChangePasswordBody) =>
  apiSend('post', '/auth/password/change', { body });
export const completeSocialSignup = (body: SocialCompleteBody) =>
  apiSend('post', '/auth/social/complete', { body });
export const fetchSocialProviders = () => apiGet('/auth/social/providers');
