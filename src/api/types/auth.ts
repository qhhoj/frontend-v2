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
}

/** backend: apps/api/src/modules/auth/core/dto/session.response.ts (SessionResponse) */
export interface SessionResponse {
  /** Null until the second factor passes. */
  user: SessionUser | null;
  csrfToken: string | null;
  twoFactorRequired: boolean;
  passwordChangeRequired: boolean;
  impersonatorId: string | null;
}

/** backend: auth/core/dto/login.dto.ts */
export interface LoginBody {
  username: string;
  password: string;
}

/** backend: auth/registration/dto/register.dto.ts */
export interface RegisterBody {
  username: string;
  email: string;
  password: string;
}
