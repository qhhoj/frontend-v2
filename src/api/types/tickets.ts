import type { Schemas } from '../schemas';
import type { JsonBodyOf, QueryOf } from '../typed';

/** backend: libs/community tickets.ts */
export const TICKET_TITLE_MAX_LENGTH = 100;
export const TICKET_BODY_MAX_LENGTH = 8192;
export const TICKET_ISSUE_URL_MAX_LENGTH = 200;
export const TICKETS_PAGE_SIZE = 50;

/** backend: tickets/core/dto/ticket.response.ts (TicketLinkResponse) */
export type TicketLink = Schemas['TicketLinkResponse'];
/** backend: ticket.response.ts (TicketListItemResponse) */
export type TicketListItem = Schemas['TicketListItemResponse'];
/** backend: ticket.response.ts (TicketMessageResponse); `bodyHtml` has raw HTML escaped. */
export type TicketMessage = Schemas['TicketMessageResponse'];
/** backend: ticket.response.ts (TicketPermissionsResponse) */
export type TicketPermissions = Schemas['TicketPermissionsResponse'];
/** backend: ticket.response.ts (TicketDetailResponse) */
export type TicketDetail = Schemas['TicketDetailResponse'];
/** backend: tickets/core/dto/ticket-list.dto.ts; `open=true` lists open tickets, `open=false` closed ones, unset lists both. */
export type TicketListQuery = Required<Omit<QueryOf<'/tickets'>, 'open'>> &
  Pick<QueryOf<'/tickets'>, 'open'>;
/** backend: tickets/editing/dto/update-ticket.dto.ts */
export type TicketPatch = JsonBodyOf<'/tickets/{id}', 'patch'>;
/** backend: tickets/posting/dto/new-ticket.dto.ts */
export type NewProblemTicket = JsonBodyOf<'/problems/{code}/tickets', 'post'>;
export type NewGeneralTicket = JsonBodyOf<'/tickets/general', 'post'>;
/** backend: libs/community ticket-events.ts */
export const TICKET_EVENT_TYPES = [
  'new-ticket',
  'ticket-message',
  'ticket-status',
] as const satisfies readonly Schemas['TicketEventFrame']['event'][];
export type TicketEvent = Schemas['TicketEventResponse'];
