import { apiRequest } from './client';
import type { HomeResponse } from './types/home';

export const fetchHome = () => apiRequest<HomeResponse>('/home');

/** The sign-in screen reads only the counts of `GET /home`. */
export const fetchHomeCounts = async () => (await fetchHome()).counts;
