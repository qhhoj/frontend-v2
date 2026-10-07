import { apiRequest } from './client';
import type { Profile, ProfilePatch } from './types/profile';

export const fetchProfile = () => apiRequest<Profile>('/profile');
export const updateProfile = (patch: ProfilePatch) =>
  apiRequest<Profile>('/profile', { method: 'PATCH', body: patch });
