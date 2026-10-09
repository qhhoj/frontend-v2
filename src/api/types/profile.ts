import type { Schemas } from '../schemas';
import type { JsonBodyOf } from '../typed';

/** backend: users/profile/dto/profile.response.ts (ProfileOrganizationResponse) */
export type ProfileOrganization = Schemas['ProfileOrganizationResponse'];

/** backend: users/profile/dto/profile.response.ts (ProfileResponse) */
export type Profile = Schemas['ProfileResponse'];

/** backend: users/profile/dto/profile.dto.ts (UpdateProfileDto); the SPA writes a subset of the fields. */
export type ProfilePatch = JsonBodyOf<'/profile', 'patch'>;
