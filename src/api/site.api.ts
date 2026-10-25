import { apiGet } from './typed';

/** The public `GET /site` (cached privately for 60 s by the backend); the admin screens read it no-cache in `site-admin.api.ts`. */
export const fetchSite = () => apiGet('/site');

/** The read that sets the server clock (at boot, then again by `keepServerClockSynced`): `no-store`, so the `Date` header is the server's now, not a cached copy's. */
export const syncClockWithServer = () => apiGet('/site', { cache: 'no-store' });
