import { apiGet, apiSend, apiUrl } from './typed';
import type {
  ApiToken,
  DataExportStatus,
  PasskeyCreationOptions,
  ScratchCodes,
  ScratchCodesRemaining,
  SecurityKey,
  SocialLinks,
  TotpEnrollment,
} from './types/account';
import type { Schemas } from './schemas';

export const enrollTotp = (currentPassword: string): Promise<TotpEnrollment> =>
  apiSend('post', '/auth/2fa/totp/enroll', { body: { currentPassword } });
/** The first code from the app; answers the five backup codes. */
export const confirmTotp = (code: string): Promise<ScratchCodes> =>
  apiSend('post', '/auth/2fa/totp/confirm', { body: { code } });
/** A TOTP code or a backup code (dashes and spaces already removed). */
export const disableTotp = (code: string): Promise<void> =>
  apiSend('post', '/auth/2fa/totp/disable', { body: { code } });
export const regenerateScratchCodes = (code: string): Promise<ScratchCodes> =>
  apiSend('post', '/auth/2fa/totp/scratch-codes', { body: { code } });
/** How many unused backup codes are left; 400 `totp_not_enabled` without the app, 403 while impersonating. */
export const fetchScratchCodesRemaining = (): Promise<ScratchCodesRemaining> =>
  apiGet('/auth/2fa/totp/scratch-codes');

export const securityKeyCreationOptions = (
  currentPassword: string,
): Promise<PasskeyCreationOptions> =>
  apiSend('post', '/auth/2fa/webauthn/register/options', { body: { currentPassword } });
export const verifySecurityKey = (
  name: string,
  response: Record<string, unknown>,
): Promise<SecurityKey> =>
  apiSend('post', '/auth/2fa/webauthn/register/verify', { body: { name, response } });
export const removeSecurityKey = (id: string, currentPassword: string): Promise<void> =>
  apiSend('delete', '/auth/2fa/webauthn/credentials/{credentialId}', {
    path: { credentialId: id },
    body: { currentPassword },
  });
/** The keys registered for this account (id and name only); 403 while impersonating. */
export const fetchSecurityKeys = (): Promise<SecurityKey[]> =>
  apiGet('/auth/2fa/webauthn/credentials');

/** The old token stops working at once; the new one is shown once. The backend wants the current password. */
export const regenerateApiToken = (currentPassword: string): Promise<ApiToken> =>
  apiSend('post', '/auth/token/regenerate', { body: { currentPassword } });

export const fetchDataExportStatus = (): Promise<DataExportStatus> => apiGet('/profile/data');
export const requestDataExport = (): Promise<Schemas['QueuedResponse']> =>
  apiSend('post', '/profile/data');
/** A plain link: the browser streams the zip to disk (`Content-Disposition: attachment`). */
export const DATA_EXPORT_DOWNLOAD_URL = apiUrl('/profile/data/download');

/** The providers (slugs) that sign in to this account; 403 while impersonating. */
export const fetchSocialLinks = (): Promise<SocialLinks> => apiGet('/auth/social/links');
/** The provider stops signing in to the account; the backend wants the current password. */
export const removeSocialLink = (provider: string, currentPassword: string): Promise<void> =>
  apiSend('delete', '/auth/social/links/{provider}', {
    path: { provider },
    body: { currentPassword },
  });
