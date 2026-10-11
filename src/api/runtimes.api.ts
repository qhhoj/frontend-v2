import { apiGet } from './typed';

/** Judges with their load and the compiler versions per language (public). */
export const fetchRuntimes = () => apiGet('/runtimes');
