import type { UserSummary } from './problems';

/** backend: libs/community tickets.ts */
export const TICKET_TITLE_MAX_LENGTH = 100;
export const TICKET_BODY_MAX_LENGTH = 8192;
export const TICKET_ISSUE_URL_MAX_LENGTH = 200;
export const TICKETS_PAGE_SIZE = 50;

/** backend: tickets/core/dto/ticket.response.ts (TicketLinkResponse) */
export interface TicketLink {
  type: 'problem' | 'general';
  id: string;
  /** Problem code; null for a general issue or a deleted problem. */
  key: string | null;
  /** Problem name, or the issue url. */
  title: string;
  /** SPA path for a problem, the absolute url for a general issue; empty when the problem is gone. */
  url: string;
}
/** backend: ticket.response.ts (TicketListItemResponse) */
export interface TicketListItem {
  id: string;
  title: string;
  creator: UserSummary;
  assignees: UserSummary[];
  link: TicketLink;
  isOpen: boolean;
  isContributive: boolean;
  messageCount: number;
  createdAt: string;
  lastMessageAt: string;
}
/** backend: ticket.response.ts (TicketMessageResponse); `bodyHtml` has raw HTML escaped. */
export interface TicketMessage {
  id: string;
  author: UserSummary;
  bodyHtml: string;
  createdAt: string;
}
/** backend: ticket.response.ts (TicketPermissionsResponse) */
export interface TicketPermissions {
  editNotes: boolean;
  markGood: boolean;
  assign: boolean;
}
/** backend: ticket.response.ts (TicketDetailResponse) */
export interface TicketDetail extends TicketListItem {
  notes: string;
  messages: TicketMessage[];
  can: TicketPermissions;
}
/** backend: tickets/core/dto/ticket-list.dto.ts; `open=true` lists open tickets, `open=false` closed ones, unset lists both. */
export interface TicketListQuery {
  own: boolean;
  open: boolean | undefined;
  user: string[];
  assignee: string[];
  page: number;
}
/** backend: tickets/editing/dto/update-ticket.dto.ts */
export interface TicketPatch {
  isOpen?: boolean;
  isContributive?: boolean;
  notes?: string;
  assignees?: string[];
}
/** backend: tickets/posting/dto/new-ticket.dto.ts */
export interface NewProblemTicket {
  title: string;
  body: string;
}
export interface NewGeneralTicket extends NewProblemTicket {
  issueUrl: string;
}
/** backend: libs/community ticket-events.ts */
export const TICKET_EVENT_TYPES = ['new-ticket', 'ticket-message', 'ticket-status'] as const;
export interface TicketEvent {
  type: (typeof TICKET_EVENT_TYPES)[number];
  ticketId: string;
  messageId: string | null;
  open: boolean | null;
}
