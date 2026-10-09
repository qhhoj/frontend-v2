import { Bell, Building2, LifeBuoy, Trophy } from 'lucide-vue-next';
import type { Component } from 'vue';

const KIND_ICONS: Readonly<Record<string, Component>> = {
  'ticket-new': LifeBuoy,
  'ticket-message': LifeBuoy,
  'ticket-status': LifeBuoy,
  'contest-announcement': Trophy,
  'organization-request-decided': Building2,
};

/** The row icon of a notification kind; a kind added after this build (B7's `quota-warning`) draws the bell. */
export const kindIcon = (kind: string): Component =>
  Object.hasOwn(KIND_ICONS, kind) ? KIND_ICONS[kind]! : Bell;

/** The "Loại" chips of the `/notifications` rail (M1B): each is a fixed list of backend kinds. */
export const KIND_GROUPS = ['ticket', 'contest', 'organization', 'other'] as const;
export type KindGroup = (typeof KIND_GROUPS)[number];
const GROUP_KINDS: Readonly<Record<KindGroup, readonly string[]>> = {
  ticket: ['ticket-new', 'ticket-message', 'ticket-status'],
  contest: ['contest-announcement'],
  organization: ['organization-request-decided'],
  other: ['quota-warning'],
};
/** The value of the `kind` query (requires VNOI backend B1 ask: repeatable `kind` on `GET /notifications`). */
export const kindsOfGroup = (group: KindGroup): string[] => [...GROUP_KINDS[group]];
export const isTicketKind = (kind: string): boolean => GROUP_KINDS.ticket.includes(kind);
