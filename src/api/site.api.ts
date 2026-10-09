import { apiGet } from './typed';

/** The public `GET /site` (cached privately for 60 s by the backend); the admin screens read it no-cache in `site-admin.api.ts`. */
export const fetchSite = () => apiGet('/site');
