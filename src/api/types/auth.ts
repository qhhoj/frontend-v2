/** backend: apps/api/src/modules/users/profile/dto/profile.response.ts (AppearanceResponse); 8g reads it. */
export interface SessionAppearance {
  accent: string;
  glass: number;
  glow: number;
}

/** backend: apps/api/src/modules/auth/core/dto/session.response.ts (UserResponse) */
export interface SessionUser {
  id: string;
  username: string;
  email: string;
  isStaff: boolean;
  isSuperuser: boolean;
  permissions: string[];
  isTotpEnabled: boolean;
  isWebauthnEnabled: boolean;
  /** The stored theme preference (B2): `auto`, a theme id, or a legacy `light` / `dark`. The theme store still reads the profile; 8g moves it here. */
  siteTheme: string;
  appearance: SessionAppearance | null;
  languageId: string | null;
}

export type SecondFactorMethod = 'totp' | 'webauthn';

/** backend: auth/core/dto/session.response.ts (TwoFactorPendingResponse): all a password-only session may learn. `methods` is empty when the factor was disabled meanwhile. */
export interface TwoFactorPending {
  username: string;
  methods: SecondFactorMethod[];
}

/** backend: auth/core/dto/session.response.ts (SessionResponse) */
export interface SessionResponse {
  /** Null until the second factor passes. */
  user: SessionUser | null;
  csrfToken: string | null;
  twoFactorRequired: boolean;
  /** Set exactly while `twoFactorRequired`. */
  twoFactor: TwoFactorPending | null;
  passwordChangeRequired: boolean;
  impersonatorId: string | null;
}

/** backend: auth/core/dto/login.dto.ts */
export interface LoginBody {
  username: string;
  password: string;
}

/** backend: auth/registration/dto/register.dto.ts; the optional ids are sent only when chosen. */
export interface RegisterBody {
  username: string;
  email: string;
  password: string;
  organizationId?: string;
  languageId?: string;
}

/** backend: auth/registration/dto/username-available.response.ts (UsernameAvailableResponse) */
export interface UsernameAvailableResponse {
  available: boolean;
}

/** backend: auth/social/dto/social-providers.response.ts (SocialProvidersResponse); slugs are `google`, `facebook`, `github`. */
export interface SocialProvidersResponse {
  providers: string[];
}

/** backend: auth/two-factor/webauthn.controller.ts returns @simplewebauthn/server `PublicKeyCredentialRequestOptionsJSON`; the browser parses it. */
export type PasskeyRequestOptions = Record<string, unknown>;

/** backend: auth/password-reset/dto/password-reset.dto.ts (PasswordResetConfirmDto) */
export interface PasswordResetBody {
  token: string;
  newPassword: string;
}

/** backend: auth/core/dto/change-password.dto.ts */
export interface ChangePasswordBody {
  currentPassword: string;
  newPassword: string;
}

/** backend: auth/social/dto/social-complete.dto.ts */
export interface SocialCompleteBody {
  token: string;
  username: string;
  password: string;
  organizationId?: string;
  languageId?: string;
}
