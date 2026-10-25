import type { Schemas } from '../schemas';

/** backend: auth/two-factor/dto/totp.response.ts (TotpEnrollmentResponse); shown once, never cached. */
export type TotpEnrollment = Schemas['TotpEnrollmentResponse'];

/** backend: auth/two-factor/dto/totp.response.ts (ScratchCodesResponse); five codes, shown once. */
export type ScratchCodes = Schemas['ScratchCodesResponse'];

/** backend: auth/two-factor/dto/totp.response.ts (ScratchCodesRemainingResponse) */
export type ScratchCodesRemaining = Schemas['ScratchCodesRemainingResponse'];

/** backend: auth/two-factor/dto/webauthn.response.ts (WebauthnCredentialResponse) */
export type SecurityKey = Schemas['WebauthnCredentialResponse'];

/** backend: @simplewebauthn/server PublicKeyCredentialCreationOptionsJSON; the browser parses it. */
export type PasskeyCreationOptions = Record<string, unknown>;

/** backend: auth/core/dto/token.response.ts (RegenerateTokenResponse); shown once, never cached. */
export type ApiToken = Schemas['RegenerateTokenResponse'];

/** backend: users/data/dto/user-data.response.ts (UserDataStatusResponse) */
export type DataExportStatus = Schemas['UserDataStatusResponse'];

/** backend: auth/social/dto/social-links.response.ts (SocialLinksResponse) */
export type SocialLinks = Schemas['SocialLinksResponse'];
