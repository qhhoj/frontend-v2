import { apiGet } from './typed';

export const fetchHome = () => apiGet('/home');

/** The sign-in screen reads only the counts of `GET /home`. */
export const fetchHomeCounts = async () => (await fetchHome()).counts;
