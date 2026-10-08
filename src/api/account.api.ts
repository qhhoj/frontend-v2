import { apiRequest, buildUrl } from './client';
import type {
  ApiToken,
  DataExportStatus,
  PasskeyCreationOptions,
  ScratchCodes,
  ScratchCodesRemaining,
  SecurityKey,
  TotpEnrollment,
} from './types/account';

const post = <Result>(path: string, body?: unknown) =>
  apiRequest<Result>(path, { method: 'POST', body });

export const enrollTotp = (currentPassword: string) =>
  post<TotpEnrollment>('/auth/2fa/totp/enroll', { currentPassword });
/** The first code from the app; answers the five backup codes. */
export const confirmTotp = (code: string) => post<ScratchCodes>('/auth/2fa/totp/confirm', { code });
/** A TOTP code or a backup code (dashes and spaces already removed). */
export const disableTotp = (code: string) => post<void>('/auth/2fa/totp/disable', { code });
export const regenerateScratchCodes = (code: string) =>
  post<ScratchCodes>('/auth/2fa/totp/scratch-codes', { code });
/** How many unused backup codes are left; 400 `totp_not_enabled` without the app, 403 while impersonating. */
export const fetchScratchCodesRemaining = () =>
  apiRequest<ScratchCodesRemaining>('/auth/2fa/totp/scratch-codes');

export const securityKeyCreationOptions = (currentPassword: string) =>
  post<PasskeyCreationOptions>('/auth/2fa/webauthn/register/options', { currentPassword });
export const verifySecurityKey = (name: string, response: object) =>
  post<SecurityKey>('/auth/2fa/webauthn/register/verify', { name, response });
export const removeSecurityKey = (id: string, currentPassword: string) =>
  apiRequest<void>(`/auth/2fa/webauthn/credentials/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    body: { currentPassword },
  });
/** The keys registered for this account (id and name only); 403 while impersonating. */
export const fetchSecurityKeys = () => apiRequest<SecurityKey[]>('/auth/2fa/webauthn/credentials');

/** The old token stops working at once; the new one is shown once. */
export const regenerateApiToken = () => post<ApiToken>('/auth/token/regenerate');

export const fetchDataExportStatus = () => apiRequest<DataExportStatus>('/profile/data');
export const requestDataExport = () => post<{ queued: true }>('/profile/data');
/** A plain link: the browser streams the zip to disk (`Content-Disposition: attachment`). */
export const DATA_EXPORT_DOWNLOAD_URL = buildUrl('/profile/data/download');
