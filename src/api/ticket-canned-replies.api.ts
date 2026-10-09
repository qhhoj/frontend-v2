import { apiGetPage, apiSend } from './typed';
import type { CannedReplyBody, CannedReplyPatch } from './types/tickets';

/** At most 100 replies exist, so page 1 holds them all. */
export const fetchCannedReplies = () =>
  apiGetPage('/ticket-canned-replies', { query: { page: 1 } });
export const createCannedReply = (body: CannedReplyBody) =>
  apiSend('post', '/ticket-canned-replies', { body });
export const updateCannedReply = (id: string, patch: CannedReplyPatch) =>
  apiSend('patch', '/ticket-canned-replies/{id}', { path: { id }, body: patch });
export const deleteCannedReply = (id: string) =>
  apiSend('delete', '/ticket-canned-replies/{id}', { path: { id } });
