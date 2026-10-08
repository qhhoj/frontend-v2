import { apiRequest } from './client';
import type { HomeCounts } from './types/home';

/** `GET /home` also carries recent comments, new problems and top users; the sign-in screen reads only the counts. */
export const fetchHomeCounts = async () =>
  (await apiRequest<{ counts: HomeCounts }>('/home')).counts;
