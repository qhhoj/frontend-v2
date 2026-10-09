import type { Schemas } from '../schemas';
import type { DataOf, JsonBodyOf } from '../typed';

/** backend: apps/api/src/modules/users/profile/dto/profile.response.ts (AppearanceResponse); 8g reads it. */
export type SessionAppearance = Schemas['AppearanceResponse'];

/** backend: apps/api/src/modules/auth/core/dto/session.response.ts (UserResponse) */
export type SessionUser = Schemas['UserResponse'];

/** backend: auth/core/dto/session.response.ts (TwoFactorPendingResponse): all a password-only session may learn. `methods` is empty when the factor was disabled meanwhile. */
export type TwoFactorPending = Schemas['TwoFactorPendingResponse'];

export type SecondFactorMethod = TwoFactorPending['methods'][number];

/** backend: auth/core/dto/session.response.ts (SessionResponse) */
export type SessionResponse = Schemas['SessionResponse'];

/** backend: auth/core/dto/login.dto.ts */
export type LoginBody = JsonBodyOf<'/auth/login', 'post'>;

/** backend: auth/registration/dto/register.dto.ts; the optional ids are sent only when chosen. */
export type RegisterBody = JsonBodyOf<'/auth/register', 'post'>;

/** backend: auth/registration/dto/username-available.response.ts (UsernameAvailableResponse) */
export type UsernameAvailableResponse = Schemas['UsernameAvailableResponse'];

/** backend: auth/social/dto/social-providers.response.ts (SocialProvidersResponse); slugs are `google`, `facebook`, `github`. */
export type SocialProvidersResponse = Schemas['SocialProvidersResponse'];

/** backend: auth/two-factor/webauthn.controller.ts returns @simplewebauthn/server `PublicKeyCredentialRequestOptionsJSON`; the browser parses it. */
export type PasskeyRequestOptions = NonNullable<DataOf<'/auth/2fa/webauthn/login/options', 'post'>>;

/** backend: auth/password-reset/dto/password-reset.dto.ts (PasswordResetConfirmDto) */
export type PasswordResetBody = Schemas['PasswordResetConfirmDto'];

/** backend: auth/core/dto/change-password.dto.ts */
export type ChangePasswordBody = Schemas['ChangePasswordDto'];

/** backend: auth/social/dto/social-complete.dto.ts */
export type SocialCompleteBody = Schemas['SocialCompleteDto'];
