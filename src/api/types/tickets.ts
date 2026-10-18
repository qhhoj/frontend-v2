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
export type TicketListQuery = Required<
  Omit<QueryOf<'/tickets'>, 'open' | 'awaiting' | 'q' | 'aboutMine'>
> &
  Pick<QueryOf<'/tickets'>, 'open' | 'awaiting' | 'q' | 'aboutMine'>;
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

/** backend: tickets/core/dto/ticket.response.ts (TicketTimelineEntryResponse): exactly one of `message` and `event` is set. */
export type TicketTimelineEntry = Schemas['TicketTimelineEntryResponse'];
/** backend: ticket.response.ts (TicketTimelineEventResponse) */
export type TicketTimelineEvent = Schemas['TicketTimelineEventResponse'];
export type TicketTimelineType = TicketTimelineEvent['type'];
/** backend: tickets/alerts/dto/ticket-summary.response.ts (TicketSummaryResponse) */
export type TicketSummary = Schemas['TicketSummaryResponse'];
/** backend: tickets/canned/dto/canned-reply.response.ts (CannedReplyResponse); `body` keeps `{tên}` / `{bài}`. */
export type CannedReply = Schemas['CannedReplyResponse'];
export type CannedReplyBody = JsonBodyOf<'/ticket-canned-replies', 'post'>;
export type CannedReplyPatch = JsonBodyOf<'/ticket-canned-replies/{id}', 'patch'>;

/** backend: libs/community TICKET_TIMELINE_CAP: the ticket keeps its newest 200 events. */
export const TICKET_TIMELINE_CAP = 200;
/** backend: libs/database TICKET_CANNED_REPLY_TITLE_MAX / _BODY_MAX, libs/community TICKET_CANNED_REPLIES_MAX, the DTO's `@Max(10000)` order. */
export const CANNED_REPLY_TITLE_MAX_LENGTH = 60;
export const CANNED_REPLY_BODY_MAX_LENGTH = 8192;
export const CANNED_REPLY_ORDER_MAX = 10000;
export const CANNED_REPLIES_MAX = 100;
