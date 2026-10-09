import type {
  NewGeneralTicket,
  NewProblemTicket,
  TicketListQuery,
  TicketPatch,
} from './types/tickets';
import { apiGet, apiGetPage, apiSend } from './typed';

export const fetchTickets = (query: TicketListQuery) => apiGetPage('/tickets', { query });
export const fetchTicket = (id: string) => apiGet('/tickets/{id}', { path: { id } });
export const createProblemTicket = (code: string, draft: NewProblemTicket) =>
  apiSend('post', '/problems/{code}/tickets', { path: { code }, body: draft });
export const createGeneralTicket = (draft: NewGeneralTicket) =>
  apiSend('post', '/tickets/general', { body: draft });
export const postTicketMessage = (id: string, body: string) =>
  apiSend('post', '/tickets/{id}/messages', { path: { id }, body: { body } });
export const updateTicket = (id: string, patch: TicketPatch) =>
  apiSend('patch', '/tickets/{id}', { path: { id }, body: patch });

/** `{ assignedOpen, awaitingStaff }`; `awaitingStaff` is 0 without `judge.change_ticket`. `no-cache` because the backend caches it 15 s. */
export const fetchTicketSummary = () => apiGet('/tickets/summary', { cache: 'no-cache' });
