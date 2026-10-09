import { apiGetPage, apiSend } from './typed';
import type { CreateShortLinkBody, ShortLinkListQuery } from './types/short-links';

export const createShortLink = (body: CreateShortLinkBody) =>
  apiSend('post', '/short-links', { body });
export const fetchShortLinks = (query: ShortLinkListQuery) => apiGetPage('/short-links', { query });
export const deleteShortLink = (code: string) =>
  apiSend('delete', '/short-links/{code}', { path: { code } });
