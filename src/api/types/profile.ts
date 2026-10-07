/** backend: apps/api/src/modules/users/profile/dto/profile.response.ts (fields the SPA reads) */
export interface Profile {
  firstName: string;
  timezone: string;
  languageId: string | null;
  aceTheme: string;
  /** `auto | light | dark` (backend SITE_THEMES). */
  siteTheme: string;
  mathEngine: string;
}

/** backend: users/profile/dto/profile.dto.ts (UpdateProfileDto, the fields the SPA writes) */
export interface ProfilePatch {
  siteTheme?: string;
  languageId?: string;
}
