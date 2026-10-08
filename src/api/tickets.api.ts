import { apiPage, apiRequest } from './client';
import type {
  NewGeneralTicket,
  NewProblemTicket,
  TicketDetail,
  TicketListItem,
  TicketListQuery,
  TicketMessage,
  TicketPatch,
} from './types/tickets';

const ticketPath = (id: string) => `/tickets/${encodeURIComponent(id)}`;

export const fetchTickets = (query: TicketListQuery) =>
  apiPage<TicketListItem>('/tickets', { query: { ...query } });
export const fetchTicket = (id: string) => apiRequest<TicketDetail>(ticketPath(id));
export const createProblemTicket = (code: string, draft: NewProblemTicket) =>
  apiRequest<TicketDetail>(`/problems/${encodeURIComponent(code)}/tickets`, {
    method: 'POST',
    body: draft,
  });
export const createGeneralTicket = (draft: NewGeneralTicket) =>
  apiRequest<TicketDetail>('/tickets/general', { method: 'POST', body: draft });
export const postTicketMessage = (id: string, body: string) =>
  apiRequest<TicketMessage>(`${ticketPath(id)}/messages`, { method: 'POST', body: { body } });
export const updateTicket = (id: string, patch: TicketPatch) =>
  apiRequest<TicketDetail>(ticketPath(id), { method: 'PATCH', body: patch });
