/** backend: auth/two-factor/dto/totp.response.ts (TotpEnrollmentResponse); shown once, never cached. */
export interface TotpEnrollment {
  secret: string;
  otpauthUrl: string;
}

/** backend: auth/two-factor/dto/totp.response.ts (ScratchCodesResponse); five codes, shown once. */
export interface ScratchCodes {
  scratchCodes: string[];
}

/** backend: auth/two-factor/dto/totp.response.ts (ScratchCodesRemainingResponse) */
export interface ScratchCodesRemaining {
  remaining: number;
}

/** backend: auth/two-factor/dto/webauthn.response.ts (WebauthnCredentialResponse) */
export interface SecurityKey {
  id: string;
  name: string;
}

/** backend: @simplewebauthn/server PublicKeyCredentialCreationOptionsJSON; the browser parses it. */
export type PasskeyCreationOptions = Record<string, unknown>;

/** backend: auth/core/dto/token.response.ts (RegenerateTokenResponse); shown once, never cached. */
export interface ApiToken {
  token: string;
}

/** backend: users/data/dto/user-data.response.ts (UserDataStatusResponse) */
export interface DataExportStatus {
  state: 'none' | 'preparing' | 'ready';
  /** When the last prepare was requested. */
  preparedAt: string | null;
  /** When the zip was written. */
  readyAt: string | null;
  /** When the zip stops being downloadable. */
  expiresAt: string | null;
  size: number | null;
  /** Null when the once-a-day rule allows a request now. */
  nextPrepareAt: string | null;
  /** No job running, the once-a-day rule met and the three-a-day limit not used up. */
  canPrepare: boolean;
}
