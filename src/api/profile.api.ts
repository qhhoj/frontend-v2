import { apiGet, apiSend } from './typed';
import type { Profile, ProfilePatch } from './types/profile';

export const fetchProfile = (): Promise<Profile> => apiGet('/profile');
export const updateProfile = (patch: ProfilePatch): Promise<Profile> =>
  apiSend('patch', '/profile', { body: patch });
